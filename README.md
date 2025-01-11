# IITC Advanced Route Planner Plugin

## Overview
The Advanced Route Planner is a plugin for IITC (Ingress Intel Total Conversion) that helps Ingress players plan efficient routes between locations while maximizing gameplay objectives. It provides route optimization, AP/XM calculations, and time estimates for different play styles.

## Features
- **Route Planning**: Plan routes between any two locations with portal waypoints
- **Multiple Optimization Strategies**:
  - Distance-based optimization for shortest routes
  - AP-based optimization for maximum gameplay rewards
  - XM-based optimization for sustainable farming
- **Play Style Support**:
  - Quick Hack: Fast portal interactions
  - Full Deploy: Complete portal capture and deployment
  - Field Building: Optimal field creation strategies
- **Travel Modes**:
  - Walking (5 km/h)
  - Biking (15 km/h)
  - Driving (30 km/h)
- **Advanced Calculations**:
  - AP potential per portal
  - XM costs and gains
  - Time estimates including travel and interaction times
  - Route difficulty based on terrain

## Installation
1. Install IITC if you haven't already (visit [IITC-CE](https://iitc.app/))
2. Install this plugin by either:
   - Adding it through the IITC-CE plugin repository
   - Manually installing the `.user.js` file:
     1. Copy the `.user.js` file to your userscripts folder
     2. Enable it in your userscript manager (e.g., Tampermonkey)
     3. Refresh your IITC page

## Usage
1. Click the route planner icon (📍) in the IITC toolbar
2. Enter start and end locations (addresses or coordinates)
3. Configure your preferences:
   - Search radius around route
   - Play style (Quick/Full/Fields)
   - Travel mode (Walking/Biking/Driving)
   - Route optimization strategy (Distance/AP/XM)
4. Click "Find Portals" to generate your route
5. Review the suggested route and statistics
6. Optionally adjust settings and regenerate the route

## Configuration
The plugin includes several configurable constants that can be adjusted:

### Time Estimates (in seconds)
```javascript
TIME_ESTIMATES: {
    QUICK_HACK: 15,
    GLYPH_HACK: 45,
    FULL_DEPLOY: 90,
    FIELD_DEPLOY: 120,
    WALKING_SPEED: 1.4,  // meters per second
    BIKING_SPEED: 4.2,   // meters per second
    DRIVING_SPEED: 8.3,  // meters per second
    STOP_TIME: {
        TRAFFIC_LIGHT: 30,
        PARKING: 60,
        COOLDOWN: 300    // hack cooldown
    }
}
```

### AP Values
```javascript
AP_VALUES: {
    DEPLOY_RESONATOR: 125,
    DEPLOY_FIRST: 500,
    DEPLOY_LAST: 250,
    CREATE_LINK: 313,
    CREATE_FIELD: 1250,
    HACK_ENEMY: 100,
    DESTROY_RESONATOR: 75,
    DESTROY_LINK: 187,
    DESTROY_FIELD: 750,
    UPGRADE_RESONATOR: 65
}
```

### XM Values
```javascript
XM_VALUES: {
    DEPLOY_COST: 50,
    HACK_GAIN: 100,
    GLYPH_HACK_GAIN: 250,
    RECYCLE_GAIN: 80,
    MAX_XM: {
        L1: 3000,
        L8: 10000,
        L16: 20000
    }
}
```

## Advanced Features

### Route Optimization Strategies

#### Distance Optimization
- Uses nearest neighbor algorithm to minimize total travel distance
- Considers portal density and accessibility
- Optimizes for efficient movement between portals

#### AP Optimization
- Prioritizes portals with high AP potential
- Considers:
  - Uncaptured portals
  - Link/field opportunities
  - Upgrade potential
  - Enemy portal takedown value

#### XM Optimization
- Ensures sustainable XM levels throughout the route
- Balances XM costs with gains
- Prioritizes efficient XM usage while maintaining gameplay objectives

### Portal Analysis
The plugin provides detailed portal analysis including:
- AP potential breakdown
- XM cost/gain calculations
- Link/field opportunities
- Time estimates for different interaction types

## Dependencies
- IITC-CE
- Turf.js (automatically loaded by the plugin)
- Leaflet (provided by IITC)

## Known Issues
- Elevation data requires external API integration (currently returns mock data)
- Traffic and obstacle detection requires additional data sources
- Route optimization may take longer for routes with many portals

## Contributing
Contributions are welcome! Please feel free to submit pull requests or open issues for:
- Bug fixes
- Feature enhancements
- Documentation improvements
- Performance optimizations

## Support & Contact
You can reach out for support or questions through:
- Discord: amigo_4
- Ingress comms: MeridiasVRBB
- GitHub: [Tr6nt0](https://github.com/Tr6nt0)

## License
This plugin is released under the MIT License.

Copyright (c) 2025 Tr6nt0

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Credits
- Plugin author: Tr6nt0
- Original IITC project: [IITC-CE](https://iitc.app/)
- Route optimization algorithms inspired by traveling salesman problem solutions
- AP/XM calculations based on standard Ingress gameplay mechanics
