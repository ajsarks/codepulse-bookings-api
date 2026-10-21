import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function getClosestTeam(targetLocation, teamLocations, maxTravelTime) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const origins = teamLocations.map(encodeURIComponent).join('|');
  const destinations = encodeURIComponent(targetLocation);
  const mode = 'transit';

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&mode=${mode}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Error fetching data from Distance Matrix API: ${data.status}`);
    }

    let closestTeam = null;
    let shortestTime = Infinity;

    // One row per origin (team), one element per destination (the booking)
    data.rows.forEach((row, index) => {
      const element = row.elements[0];
      if (!element || element.status !== 'OK') return; // team can't reach this address

      const travelTime = element.duration.value; // seconds
      if (travelTime < shortestTime) {
        shortestTime = travelTime;
        closestTeam = teamLocations[index];
      }
    });

    if (closestTeam === null || shortestTime > maxTravelTime) {
      throw new Error(`No teams found within ${maxTravelTime / 60} minutes.`);
    }

    return {
      closestTeam,
      shortestTime: shortestTime / 60 // minutes
    };
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

export default getClosestTeam;
