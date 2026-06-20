/**
 * Generates src/data/fixtures.json from the official 2026 World Cup schedule.
 * Times are Eastern (ET/EDT, UTC-4 in June).
 */
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../src/data/fixtures.json");

/** @type {Array<[number, string, string, string, string | null, string, string]>} */
const SCHEDULE = [
  [1, "11-Jun-26", "15:00", "Mexico", "South Africa", "A", "Estadio Azteca", "Mexico City"],
  [2, "11-Jun-26", "22:00", "South Korea", "Czechia", "A", "Estadio Akron", "Guadalajara"],
  [3, "12-Jun-26", "15:00", "Canada", "Bosnia and Herzegovina", "B", "BMO Field", "Toronto"],
  [4, "12-Jun-26", "21:00", "USA", "Paraguay", "D", "SoFi Stadium", "Los Angeles"],
  [5, "13-Jun-26", "21:00", "Haiti", "Scotland", "C", "Gillette Stadium", "Boston"],
  [6, "13-Jun-26", "24:00", "Australia", "Türkiye", "D", "BC Place", "Vancouver"],
  [7, "13-Jun-26", "18:00", "Brazil", "Morocco", "C", "MetLife Stadium", "New York/New Jersey"],
  [8, "13-Jun-26", "15:00", "Qatar", "Switzerland", "B", "Levi's Stadium", "San Francisco Bay Area"],
  [9, "14-Jun-26", "19:00", "Ivory Coast", "Ecuador", "E", "Lincoln Financial Field", "Philadelphia"],
  [10, "14-Jun-26", "13:00", "Germany", "Curaçao", "E", "NRG Stadium", "Houston"],
  [11, "14-Jun-26", "16:00", "Netherlands", "Japan", "F", "AT&T Stadium", "Dallas"],
  [12, "14-Jun-26", "22:00", "Sweden", "Tunisia", "F", "Estadio BBVA", "Monterrey"],
  [13, "15-Jun-26", "18:00", "Saudi Arabia", "Uruguay", "H", "Hard Rock Stadium", "Miami"],
  [14, "15-Jun-26", "12:00", "Spain", "Cape Verde", "H", "Mercedes-Benz Stadium", "Atlanta"],
  [15, "15-Jun-26", "21:00", "Iran", "New Zealand", "G", "SoFi Stadium", "Los Angeles"],
  [16, "15-Jun-26", "15:00", "Belgium", "Egypt", "G", "Lumen Field", "Seattle"],
  [17, "16-Jun-26", "15:00", "France", "Senegal", "I", "MetLife Stadium", "New York/New Jersey"],
  [18, "16-Jun-26", "18:00", "Iraq", "Norway", "I", "Gillette Stadium", "Boston"],
  [19, "16-Jun-26", "21:00", "Argentina", "Algeria", "J", "Arrowhead Stadium", "Kansas City"],
  [20, "16-Jun-26", "24:00", "Austria", "Jordan", "J", "Levi's Stadium", "San Francisco Bay Area"],
  [21, "17-Jun-26", "19:00", "Ghana", "Panama", "L", "BMO Field", "Toronto"],
  [22, "17-Jun-26", "16:00", "England", "Croatia", "L", "AT&T Stadium", "Dallas"],
  [23, "17-Jun-26", "13:00", "Portugal", "Congo DR", "K", "NRG Stadium", "Houston"],
  [24, "17-Jun-26", "22:00", "Uzbekistan", "Colombia", "K", "Estadio Azteca", "Mexico City"],
  [25, "18-Jun-26", "12:00", "Czechia", "South Africa", "A", "Mercedes-Benz Stadium", "Atlanta"],
  [26, "18-Jun-26", "15:00", "Switzerland", "Bosnia and Herzegovina", "B", "SoFi Stadium", "Los Angeles"],
  [27, "18-Jun-26", "18:00", "Canada", "Qatar", "B", "BC Place", "Vancouver"],
  [28, "18-Jun-26", "21:00", "Mexico", "South Korea", "A", "Estadio Akron", "Guadalajara"],
  [29, "19-Jun-26", "21:00", "Brazil", "Haiti", "C", "Lincoln Financial Field", "Philadelphia"],
  [30, "19-Jun-26", "18:00", "Scotland", "Morocco", "C", "Gillette Stadium", "Boston"],
  [31, "19-Jun-26", "23:00", "Türkiye", "Paraguay", "D", "Levi's Stadium", "San Francisco Bay Area"],
  [32, "19-Jun-26", "15:00", "USA", "Australia", "D", "Lumen Field", "Seattle"],
  [33, "20-Jun-26", "16:00", "Germany", "Ivory Coast", "E", "BMO Field", "Toronto"],
  [34, "20-Jun-26", "20:00", "Ecuador", "Curaçao", "E", "Arrowhead Stadium", "Kansas City"],
  [35, "20-Jun-26", "13:00", "Netherlands", "Sweden", "F", "NRG Stadium", "Houston"],
  [36, "20-Jun-26", "24:00", "Tunisia", "Japan", "F", "Estadio BBVA", "Monterrey"],
  [37, "21-Jun-26", "18:00", "Uruguay", "Cape Verde", "H", "Hard Rock Stadium", "Miami"],
  [38, "21-Jun-26", "12:00", "Spain", "Saudi Arabia", "H", "Mercedes-Benz Stadium", "Atlanta"],
  [39, "21-Jun-26", "15:00", "Belgium", "Iran", "G", "SoFi Stadium", "Los Angeles"],
  [40, "21-Jun-26", "21:00", "New Zealand", "Egypt", "G", "BC Place", "Vancouver"],
  [41, "22-Jun-26", "20:00", "Norway", "Senegal", "I", "MetLife Stadium", "New York/New Jersey"],
  [42, "22-Jun-26", "17:00", "France", "Iraq", "I", "Lincoln Financial Field", "Philadelphia"],
  [43, "22-Jun-26", "13:00", "Argentina", "Austria", "J", "AT&T Stadium", "Dallas"],
  [44, "22-Jun-26", "23:00", "Jordan", "Algeria", "J", "Levi's Stadium", "San Francisco Bay Area"],
  [45, "23-Jun-26", "16:00", "England", "Ghana", "L", "Gillette Stadium", "Boston"],
  [46, "23-Jun-26", "19:00", "Panama", "Croatia", "L", "BMO Field", "Toronto"],
  [47, "23-Jun-26", "13:00", "Portugal", "Uzbekistan", "K", "NRG Stadium", "Houston"],
  [48, "23-Jun-26", "22:00", "Colombia", "Congo DR", "K", "Estadio Akron", "Guadalajara"],
  [49, "24-Jun-26", "18:00", "Scotland", "Brazil", "C", "Hard Rock Stadium", "Miami"],
  [50, "24-Jun-26", "18:00", "Morocco", "Haiti", "C", "Mercedes-Benz Stadium", "Atlanta"],
  [51, "24-Jun-26", "15:00", "Switzerland", "Canada", "B", "BC Place", "Vancouver"],
  [52, "24-Jun-26", "15:00", "Bosnia and Herzegovina", "Qatar", "B", "Lumen Field", "Seattle"],
  [53, "24-Jun-26", "21:00", "Czechia", "Mexico", "A", "Estadio Azteca", "Mexico City"],
  [54, "24-Jun-26", "21:00", "South Africa", "South Korea", "A", "Estadio BBVA", "Monterrey"],
  [55, "25-Jun-26", "16:00", "Curaçao", "Ivory Coast", "E", "Lincoln Financial Field", "Philadelphia"],
  [56, "25-Jun-26", "16:00", "Ecuador", "Germany", "E", "MetLife Stadium", "New York/New Jersey"],
  [57, "25-Jun-26", "19:00", "Japan", "Sweden", "F", "AT&T Stadium", "Dallas"],
  [58, "25-Jun-26", "19:00", "Tunisia", "Netherlands", "F", "Arrowhead Stadium", "Kansas City"],
  [59, "25-Jun-26", "22:00", "Türkiye", "USA", "D", "SoFi Stadium", "Los Angeles"],
  [60, "25-Jun-26", "22:00", "Paraguay", "Australia", "D", "Levi's Stadium", "San Francisco Bay Area"],
  [61, "26-Jun-26", "15:00", "Norway", "France", "I", "Gillette Stadium", "Boston"],
  [62, "26-Jun-26", "15:00", "Senegal", "Iraq", "I", "BMO Field", "Toronto"],
  [63, "26-Jun-26", "23:00", "Egypt", "Iran", "G", "Lumen Field", "Seattle"],
  [64, "26-Jun-26", "23:00", "New Zealand", "Belgium", "G", "BC Place", "Vancouver"],
  [65, "26-Jun-26", "20:00", "Cape Verde", "Saudi Arabia", "H", "NRG Stadium", "Houston"],
  [66, "26-Jun-26", "20:00", "Uruguay", "Spain", "H", "Estadio Akron", "Guadalajara"],
  [67, "27-Jun-26", "17:00", "Panama", "England", "L", "MetLife Stadium", "New York/New Jersey"],
  [68, "27-Jun-26", "17:00", "Croatia", "Ghana", "L", "Lincoln Financial Field", "Philadelphia"],
  [69, "27-Jun-26", "22:00", "Algeria", "Austria", "J", "Arrowhead Stadium", "Kansas City"],
  [70, "27-Jun-26", "22:00", "Jordan", "Argentina", "J", "AT&T Stadium", "Dallas"],
  [71, "27-Jun-26", "19:30", "Colombia", "Portugal", "K", "Hard Rock Stadium", "Miami"],
  [72, "27-Jun-26", "19:30", "Congo DR", "Uzbekistan", "K", "Mercedes-Benz Stadium", "Atlanta"],
  [73, "28-Jun-26", "15:00", "Group A Runners Up", "Group B Runners Up", null, "SoFi Stadium", "Los Angeles"],
  [74, "29-Jun-26", "16:30", "Group E Winners", "Best 3rd (A/B/C/D/F)", null, "Gillette Stadium", "Boston"],
  [75, "29-Jun-26", "21:00", "Group F Winners", "Group C Runners Up", null, "Estadio BBVA", "Monterrey"],
  [76, "29-Jun-26", "13:00", "Group C Winners", "Group F Runners Up", null, "NRG Stadium", "Houston"],
  [77, "30-Jun-26", "17:00", "Group I Winners", "Best 3rd (C/D/F/G/H)", null, "MetLife Stadium", "New York/New Jersey"],
  [78, "30-Jun-26", "13:00", "Group E Runners Up", "Group I Runners Up", null, "AT&T Stadium", "Dallas"],
  [79, "30-Jun-26", "21:00", "Group A Winners", "Best 3rd (C/E/F/H/I)", null, "Estadio Azteca", "Mexico City"],
  [80, "1-Jul-26", "12:00", "Group L Winners", "Best 3rd (E/H/I/J/K)", null, "Mercedes-Benz Stadium", "Atlanta"],
  [81, "1-Jul-26", "20:00", "Group D Winners", "Best 3rd (B/E/F/I/J)", null, "Levi's Stadium", "San Francisco Bay Area"],
  [82, "1-Jul-26", "16:00", "Group G Winners", "Best 3rd (A/E/H/I/J)", null, "Lumen Field", "Seattle"],
  [83, "2-Jul-26", "19:00", "Group K Runners Up", "Group L Runners Up", null, "BMO Field", "Toronto"],
  [84, "2-Jul-26", "15:00", "Group H Winners", "Group J Runners Up", null, "SoFi Stadium", "Los Angeles"],
  [85, "2-Jul-26", "23:00", "Group B Winners", "Best 3rd (E/F/G/I/J)", null, "BC Place", "Vancouver"],
  [86, "3-Jul-26", "18:00", "Group J Winners", "Group H Runners Up", null, "Hard Rock Stadium", "Miami"],
  [87, "3-Jul-26", "21:30", "Group K Winners", "Best 3rd (D/E/I/J/L)", null, "Arrowhead Stadium", "Kansas City"],
  [88, "3-Jul-26", "14:00", "Group D Runners Up", "Group G Runners Up", null, "AT&T Stadium", "Dallas"],
  [89, "4-Jul-26", "17:00", "Match 74 Winner", "Match 77 Winner", null, "Lincoln Financial Field", "Philadelphia"],
  [90, "4-Jul-26", "13:00", "Match 73 Winner", "Match 75 Winner", null, "NRG Stadium", "Houston"],
  [91, "5-Jul-26", "16:00", "Match 76 Winner", "Match 78 Winner", null, "MetLife Stadium", "New York/New Jersey"],
  [92, "5-Jul-26", "20:00", "Match 79 Winner", "Match 80 Winner", null, "Estadio Azteca", "Mexico City"],
  [93, "6-Jul-26", "15:00", "Match 83 Winner", "Match 84 Winner", null, "AT&T Stadium", "Dallas"],
  [94, "6-Jul-26", "20:00", "Match 81 Winner", "Match 82 Winner", null, "Lumen Field", "Seattle"],
  [95, "7-Jul-26", "12:00", "Match 86 Winner", "Match 88 Winner", null, "Mercedes-Benz Stadium", "Atlanta"],
  [96, "7-Jul-26", "16:00", "Match 85 Winner", "Match 87 Winner", null, "BC Place", "Vancouver"],
  [97, "9-Jul-26", "16:00", "Match 89 Winner", "Match 90 Winner", null, "Gillette Stadium", "Boston"],
  [98, "10-Jul-26", "15:00", "Match 93 Winner", "Match 94 Winner", null, "SoFi Stadium", "Los Angeles"],
  [99, "11-Jul-26", "17:00", "Match 91 Winner", "Match 92 Winner", null, "Hard Rock Stadium", "Miami"],
  [100, "11-Jul-26", "21:00", "Match 95 Winner", "Match 96 Winner", null, "Arrowhead Stadium", "Kansas City"],
  [101, "14-Jul-26", "15:00", "Match 97 Winner", "Match 98 Winner", null, "AT&T Stadium", "Dallas"],
  [102, "15-Jul-26", "15:00", "Match 99 Winner", "Match 100 Winner", null, "Mercedes-Benz Stadium", "Atlanta"],
  [103, "18-Jul-26", "17:00", "Match 101 Loser", "Match 102 Loser", null, "Hard Rock Stadium", "Miami"],
  [104, "19-Jul-26", "15:00", "Match 101 Winner", "Match 102 Winner", null, "MetLife Stadium", "New York/New Jersey"],
];

const MONTHS = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

function roundLabel(id, group) {
  if (id <= 72) {
    const matchday = id <= 24 ? 1 : id <= 48 ? 2 : 3;
    return group ? `Group Stage - ${matchday} (Group ${group})` : `Group Stage - ${matchday}`;
  }
  if (id <= 88) return "Round of 32";
  if (id <= 96) return "Round of 16";
  if (id <= 100) return "Quarter-finals";
  if (id <= 102) return "Semi-finals";
  if (id === 103) return "Third Place";
  return "Final";
}

function toISO(dateStr, timeET) {
  const [day, mon, yr] = dateStr.split("-");
  const year = `20${yr}`;
  const month = MONTHS[mon];
  let [hour, minute] = timeET.split(":").map(Number);
  let dayNum = Number(day);

  if (hour >= 24) {
    hour -= 24;
    dayNum += 1;
  }

  const pad = (n) => String(n).padStart(2, "0");
  // June 2026 = EDT (UTC-4)
  const local = `${year}-${month}-${pad(dayNum)}T${pad(hour)}:${pad(minute)}:00-04:00`;
  return new Date(local).toISOString();
}

const matches = SCHEDULE.map(([id, date, time, home, away, group, venue, city]) => ({
  id,
  date: toISO(date, time),
  homeTeam: home,
  awayTeam: away,
  round: roundLabel(id, group),
  group,
  venue,
  city,
  homeGoals: null,
  awayGoals: null,
  status: null,
}));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ matches }, null, 2) + "\n");
console.log(`Wrote ${matches.length} matches to ${OUT}`);
