
const express = require('express');
const app = express();
const geolib = require('geolib');


//=================RADIUS INITIALISING======================

const radius = 1000;

//================FETCHING DATA ============================

const fetchData = async () => {
  const result = await fetch('https://ignite.zook.top/data.json');
  const data = await result.json();
  return data;
};

//==================DESTRUCTURING DATA======================

const groupData = async () => {
  const data = await fetchData();
  const transformedData = data.map((item) => ({
    name: item.fullName,
    location: item.address.geo,
  }));

  let response = {};
  let visitedIndices = [];
  let groupCounter = 1;
  let groupedLocations = [];

//=======================GROUPING PEOPLE BASED ON RADIUS=========================

  for (let i = 0; i < transformedData.length; i++) {
    if (visitedIndices.includes(i)) continue;
    for (let j = i + 1; j < transformedData.length; j++) {
      if (visitedIndices.includes(j)) continue;
      const res = geolib.isPointWithinRadius(transformedData[i].location, transformedData[j].location, radius * 1000);
      if (res) {
        groupedLocations.push({ id: j, name: transformedData[j].name, location: transformedData[j].location });
        visitedIndices.push(j);
      }
    }
    groupedLocations.push({ id: i, name: transformedData[i].name, location: transformedData[i].location });
    let finalExcludedIds = [];

//====================SORTING GROUP SUCH THAT DISTANCE BETWEEN EACH PERSON IS LESS THAN THE GIVEN DISTANCE==========================

    for (let m = 0; m < groupedLocations.length; m++) {
      if (finalExcludedIds.includes(groupedLocations[m].id)) continue;
      for (let n = 0; n < groupedLocations.length; n++) {
        if (finalExcludedIds.includes(groupedLocations[n].id)) continue;
        let distance = geolib.getDistance(groupedLocations[m].location, groupedLocations[n].location);
        if (distance > radius * 1000) {
          finalExcludedIds.push(groupedLocations[n].id);
        }
      }
    }
    finalExcludedIds.map((excludedId) => {
      visitedIndices = visitedIndices.filter((id) => id !== excludedId);
    });
    finalExcludedIds.map((excludedId) => {
      groupedLocations = groupedLocations.filter((item) => item.id !== excludedId);
    });
    response['group-' + groupCounter] = groupedLocations;
    groupCounter++;
    groupedLocations = [];
  }
  return response;
};

//====================GETTING GROUP SUMMARY============================
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


// const getGroupSummary = (data) => {
//   let largestGroups = [];
//   let smallestGroups = [];
//   let largestSize = 0;
//   let smallestSize = Infinity;

//   for (const [key, value] of Object.entries(data)) {
//     if (value.length > largestSize) {
//       largestSize = value.length;
//       largestGroups = [key];
//     } else if (value.length === largestSize) {
//       largestGroups.push(key);
//     }

//     if (value.length < smallestSize) {
//       smallestSize = value.length;
//       smallestGroups = [key];
//     } else if (value.length === smallestSize) {
//       smallestGroups.push(key);
//     }
//   }

//   return {
//     groupCount: Object.keys(data).length,
//     largestGroups: largestGroups,
//     largestGroupSize: data[largestGroups[0]].length,
//     smallestGroups: smallestGroups,
//     smallestGroupSize: data[smallestGroups[0]].length,
//   };
// };

let start = async () => {
  const data = await groupData();
  const groupSummary = getGroupSummary(data);
};
start();

app.set('view engine', 'hbs');

app.get('/', async (req, res) => {
  try {
    const data = await groupData();
    const groupSummary = getGroupSummary(data);
    res.render('view', { data, groupSummary });
  } catch (err) {
    console.log(err)
    res.status(500).send('Internal Server Error');
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
