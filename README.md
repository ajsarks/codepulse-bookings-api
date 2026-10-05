# CodePulse Bookings API

Backend API for the **CodePulse Bookings** platform.

The service automates booking assignment by combining location-based team selection with staff availability and workload balancing. When a booking is created, the backend determines which team can reach the booking location most efficiently and then selects two available team members with the lightest workload.

## Overview

CodePulse Bookings is a full-stack scheduling application consisting of:

- **Frontend:** `Codepulse-bookings-frontend`
- **Backend:** `codepulse-bookings-api`

The React frontend handles the booking interface, while this Node.js backend manages bookings, team selection, team-member availability, workload balancing, MongoDB persistence, and Google Maps integration.

## Tech Stack

- Node.js
- JavaScript
- MongoDB
- Mongoose
- REST APIs
- Google Distance Matrix API
- `node-fetch`
- `dotenv`

## Key Features

- Booking creation and management
- Team and team-member management
- MongoDB persistence using Mongoose
- Google Distance Matrix API integration
- Location-based team selection
- Maximum travel-time constraints
- Weekday and monthly availability filtering
- Unavailable-date handling
- Workload-aware team-member assignment
- Automatic selection of two staff members per booking

## Booking Assignment

The backend uses a two-stage assignment process.

### 1. Select the Closest Team

The booking location is compared against the locations of available teams using the **Google Distance Matrix API**.

```text
Booking Location
       |
       v
Candidate Team Locations
       |
       v
Google Distance Matrix API
       |
       v
Travel-Time Estimates
       |
       v
Find Shortest Travel Time
       |
       v
Check Maximum Travel Time
       |
       v
Selected Team
```

The backend sends all candidate team locations as origins and the booking location as the destination.

The team with the shortest estimated travel time is selected, provided that its travel time is within the configured maximum allowed travel time.

If no team can satisfy the travel-time requirement, the booking cannot be assigned.

### 2. Allocate Team Members

Once a team has been selected, the backend determines which members of that team should receive the booking.

The booking date is converted into:

- the day of the week
- the month of the year

MongoDB is then queried for members who:

- belong to the selected team,
- are available during that month,
- are normally available on that weekday,
- have not marked the requested date as unavailable.

```text
Selected Team
     |
     v
Booking Date
     |
     +----------------+
     |                |
     v                v
Weekday             Month
     |                |
     +--------+-------+
              |
              v
    Find Eligible Members
              |
              v
    Remove Unavailable Staff
              |
              v
      Eligible Members
```

## Workload Balancing

After determining which team members are available, the backend counts how many bookings each member already has on the requested date.

```text
Eligible Members
       |
       v
Count Existing Bookings
       |
       v
Sort by Booking Count
Fewest -> Most
       |
       v
Select First Two
       |
       v
Assign Booking
```

The two team members with the fewest existing bookings are selected.

This provides simple workload balancing so bookings are distributed more evenly instead of repeatedly assigning work to the same staff members.

## Full Assignment Flow

```text
New Booking
     |
     v
Booking Location
     |
     v
Candidate Teams
     |
     v
Google Distance Matrix
     |
     v
Closest Team Within
Travel-Time Limit
     |
     v
Check Team Members
     |
     v
Month Availability
     |
     v
Weekday Availability
     |
     v
Unavailable-Date Check
     |
     v
Count Existing Bookings
     |
     v
Sort by Workload
     |
     v
Select Two Members
     |
     v
Booking Assignment
```

## Architecture

```text
React Frontend
      |
      | HTTP / REST
      v
Node.js API
      |
      +--------------------------+
      |                          |
      v                          v
Booking Logic            Team Selection
                                 |
                                 v
                       Google Distance Matrix
                                 |
                                 v
                           Selected Team
                                 |
                                 v
                       Member Allocation
                                 |
                    +------------+------------+
                    |                         |
                    v                         v
              Availability              Workload
                 Check                    Check
                    |                         |
                    +------------+------------+
                                 |
                                 v
                          Assigned Members
                                 |
                                 v
                              MongoDB
```

## Google Distance Matrix Integration

The backend uses the Google Distance Matrix API to compare travel times between candidate team locations and a booking destination.

The Google Maps API key is loaded from an environment variable:

```text
GOOGLE_MAPS_API_KEY
```

The API key should never be committed directly to the repository.

The current implementation uses transit travel estimates when comparing team locations.

## Team-Member Allocation

The allocation service filters team members using information stored in MongoDB.

Each member can have:

- a team
- available months
- recurring weekday availability
- specific unavailable dates

After filtering, the service counts existing bookings for each eligible member and returns the two members with the lowest booking count for that day.

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/ajsarks/codepulse-bookings-api.git
cd codepulse-bookings-api
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file containing the required configuration.

For example:

```text
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
MONGODB_URI=your_mongodb_connection_string
```

Do not commit `.env` or production credentials to GitHub.

### Start the Application

Run the server using the start script configured in `package.json`.

```bash
npm start
```

## Related Repository

### CodePulse Bookings Frontend

React frontend responsible for the booking interface and communication with this API.

```text
https://github.com/ajsarks/Codepulse-bookings-frontend
```

## Purpose

CodePulse Bookings was designed to automate both **team selection** and **staff assignment**.

Instead of manually determining who should handle each booking, the backend considers:

- where each team is located,
- how long each team would take to reach the booking,
- whether staff are available,
- and how much work each person already has.

The result is a location-aware and workload-aware booking assignment workflow.
