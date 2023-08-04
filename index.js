const express = require('express');
const app = express();
const geolib = require('geolib');

// RADIUS INITIALISING
const radius = 1000;

// FETCHING DATA
const fetchData = async () => {
  const result = await fetch('https://ignite.zook.top/data.json');
  const data = await result.json();
  return data;
};

// Group data based on location proximity
const groupData = async () => {
  const data = await fetchData();

  // Transforming data into a new format with name and location
  const transformedData = data.map(({ fullName, address: { geo } }) => ({ name: fullName, location: geo }));

  let response = {};
  let visitedIndices = [];
  let groupCounter = 1;

  for (let i = 0; i < transformedData.length; i++) {
    if (visitedIndices.includes(i)) continue;

    let groupedLocations = [];
    for (let j = i + 1; j < transformedData.length; j++) {
      if (visitedIndices.includes(j)) continue;

      // Check if the distance between two locations is within the given radius
      const res = geolib.isPointWithinRadius(transformedData[i].location, transformedData[j].location, radius * 1000);
      if (res) {
        groupedLocations.push({ id: j, name: transformedData[j].name, location: transformedData[j].location });
        visitedIndices.push(j);
      }
    }

    // Include the current location in the group
    groupedLocations.push({ id: i, name: transformedData[i].name, location: transformedData[i].location });
    let finalExcludedIds = [];

    // Sort the group such that the distance between each person is less than the given distance
    for (let m = 0; m < groupedLocations.length; m++) {
      if (finalExcludedIds.includes(groupedLocations[m].id)) continue;
      for (let n = 0; n < groupedLocations.length; n++) {
        if (finalExcludedIds.includes(groupedLocations[n].id)) continue;

        // Calculate the distance between two locations
        let distance = geolib.getDistance(groupedLocations[m].location, groupedLocations[n].location);
        if (distance > radius * 1000) {
          finalExcludedIds.push(groupedLocations[n].id);
        }
      }
    }

    // Remove excluded locations from the group
    finalExcludedIds.forEach((excludedId) => {
      visitedIndices = visitedIndices.filter((id) => id !== excludedId);
      groupedLocations = groupedLocations.filter((item) => item.id !== excludedId);
    });

    // Store the grouped locations in the response object
    response['group-' + groupCounter++] = groupedLocations;
  }

  return response;
};

// Getting group summary
const getGroupSummary = (data) => {
  let largest = [], smallest = [], largestSize = 0, smallestSize = Infinity;

  for (const [key, value] of Object.entries(data)) {
    if (value.length > largestSize) largestSize = value.length, largest = [key];
    else if (value.length === largestSize) largest.push(key);
    if (value.length < smallestSize) smallestSize = value.length, smallest = [key];
    else if (value.length === smallestSize) smallest.push(key);
  }

  return {
    groupCount: Object.keys(data).length,
    largestGroups: largest,
    largestGroupSize: data[largest[0]].length,
    smallestGroups: smallest,
    smallestGroupSize: data[smallest[0]].length,
  };
};

app.set('view engine', 'hbs');

app.get('/', async (req, res) => {
  try {
    const data = await groupData();
    const groupSummary = getGroupSummary(data);
    res.render('view', { data, groupSummary });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
