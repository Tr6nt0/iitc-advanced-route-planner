// ==UserScript==
// @id             iitc-plugin-route-planner
// @name           IITC plugin: Advanced Portal Route Planner
// @category       Layer
// @version        1.1.0
// @namespace      https://github.com/IITC-CE/ingress-intel-total-conversion
// @description    Advanced route planning with AP/XM calculations, time estimates, and optimization
// @match          https://intel.ingress.com/*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
    if(typeof window.plugin !== 'function') window.plugin = function() {};

    // PLUGIN START ////////////////////////////////////////////////////////
    window.plugin.routePlanner = function() {};
    const thisPlugin = window.plugin.routePlanner;
    
    // Enhanced constants with additional gameplay scenarios
    const CONFIG = {
        PORTAL_RANGE: 40,
        TIME_ESTIMATES: {
            QUICK_HACK: 15,
            GLYPH_HACK: 45,
            FULL_DEPLOY: 90,
            FIELD_DEPLOY: 120,
            WALKING_SPEED: 1.4,
            BIKING_SPEED: 4.2,  // Added biking speed (15 km/h)
            DRIVING_SPEED: 8.3,
            STOP_TIME: {        // Added stop times for different scenarios
                TRAFFIC_LIGHT: 30,
                PARKING: 60,
                COOLDOWN: 300   // 5-minute cooldown for hacks
            }
        },
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
        },
        MAX_LINK_RANGE: {
            L8: 655367,
            L7: 327684,
            L6: 163842,
            L5: 81921,
            L4: 40961,
            L3: 20481,
            L2: 10241,
            L1: 5121
        },
        // Added energy calculations
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
    };

    // Enhanced state management with XM tracking
    thisPlugin.state = {
        selectedPortals: new Set(),
        routeData: null,
        playStyle: 'quick',
        travelMode: 'walking',
        currentLayer: null,
        markerLayer: null,
        currentXM: CONFIG.XM_VALUES.MAX_XM.L8, // Default to L8 XM capacity
        xmHistory: [],
        routeOptimization: 'distance' // distance, ap, or xm
    };

    // New optimization functions
    thisPlugin.optimizeRoute = function(portals, method = 'distance') {
        if (portals.length <= 2) return portals;

        let optimizedRoute;
        switch(method) {
            case 'ap':
                optimizedRoute = thisPlugin.optimizeForAP(portals);
                break;
            case 'xm':
                optimizedRoute = thisPlugin.optimizeForXM(portals);
                break;
            default:
                optimizedRoute = thisPlugin.optimizeForDistance(portals);
        }
        return optimizedRoute;
    };

    thisPlugin.optimizeForDistance = function(portals) {
        // Simple nearest neighbor implementation
        const optimized = [portals[0]];
        const remaining = portals.slice(1);

        while (remaining.length > 0) {
            const current = optimized[optimized.length - 1];
            let nearest = 0;
            let minDistance = Infinity;

            remaining.forEach((portal, index) => {
                const distance = current.getLatLng().distanceTo(portal.getLatLng());
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = index;
                }
            });

            optimized.push(remaining[nearest]);
            remaining.splice(nearest, 1);
        }

        return optimized;
    };

    thisPlugin.optimizeForAP = function(portals) {
        // Prioritize high AP potential while considering distance
        return portals.sort((a, b) => {
            const apA = thisPlugin.calculateAPPotential(a);
            const apB = thisPlugin.calculateAPPotential(b);
            return apB - apA;
        });
    };

    thisPlugin.optimizeForXM = function(portals) {
        // Optimize for XM efficiency
        let currentXM = thisPlugin.state.currentXM;
        const optimized = [];
        const unoptimized = [...portals];

        while (unoptimized.length > 0) {
            let bestPortalIndex = 0;
            let bestScore = -Infinity;

            unoptimized.forEach((portal, index) => {
                const xmCost = thisPlugin.calculateXMCost(portal);
                const xmGain = thisPlugin.calculateXMGain(portal);
                const netXM = xmGain - xmCost;
                const score = netXM / (xmCost || 1); // Avoid division by zero
                
                if (score > bestScore && currentXM >= xmCost) {
                    bestScore = score;
                    bestPortalIndex = index;
                }
            });

            const bestPortal = unoptimized[bestPortalIndex];
            optimized.push(bestPortal);
            currentXM += thisPlugin.calculateXMGain(bestPortal) - thisPlugin.calculateXMCost(bestPortal);
            unoptimized.splice(bestPortalIndex, 1);
        }

        return optimized;
    };

    // Enhanced XM calculations
    thisPlugin.calculateXMCost = function(portal) {
        const data = portal.options.data;
        let cost = 0;
        
        switch(thisPlugin.state.playStyle) {
            case 'quick':
                cost = 0; // Just hacking
                break;
            case 'full':
                cost = CONFIG.XM_VALUES.DEPLOY_COST * (8 - data.resCount);
                break;
            case 'fields':
                cost = CONFIG.XM_VALUES.DEPLOY_COST * (8 - data.resCount);
                // Add link/field costs
                const nearbyPortals = thisPlugin.findNearbyPortals(portal.getLatLng(), 
                    CONFIG.MAX_LINK_RANGE[`L${data.level}`]);
                cost += nearbyPortals.length * 50; // Estimated XM per link
                break;
        }
        
        return cost;
    };

    thisPlugin.calculateXMGain = function(portal) {
        let gain = 0;
        
        switch(thisPlugin.state.playStyle) {
            case 'quick':
                gain = CONFIG.XM_VALUES.HACK_GAIN;
                break;
            case 'full':
            case 'fields':
                gain = CONFIG.XM_VALUES.GLYPH_HACK_GAIN;
                break;
        }
        
        // Add recharge XM from portal
        gain += Math.floor(portal.options.data.energy * 0.5);
        
        return gain;
    };

    // Enhance route finding with terrain and obstacle detection
    thisPlugin.findPortalsAlongRoute = async function(routeGeometry, radius) {
        // Clear existing layers
        if (thisPlugin.state.currentLayer) {
            map.removeLayer(thisPlugin.state.currentLayer);
        }
        if (thisPlugin.state.markerLayer) {
            map.removeLayer(thisPlugin.state.markerLayer);
        }

        // Add route to map with elevation profile
        const elevationData = await thisPlugin.getElevationProfile(routeGeometry);
        
        thisPlugin.state.currentLayer = L.geoJSON(routeGeometry, {
            style: function(feature) {
                return {
                    color: thisPlugin.getRouteColor(feature, elevationData),
                    weight: 3,
                    opacity: 0.7
                };
            }
        }).addTo(map);

        // Create buffer with terrain consideration
        const buffer = turf.buffer(routeGeometry, radius, {units: 'meters'});
        
        // Find and filter portals
        const portalsInRange = thisPlugin.findAccessiblePortals(buffer, elevationData);
        
        // Optimize route based on selected method
        const optimizedPortals = thisPlugin.optimizeRoute(
            portalsInRange.map(p => p.portal),
            thisPlugin.state.routeOptimization
        );

        thisPlugin.state.routeData = {
            route: routeGeometry,
            portals: optimizedPortals,
            buffer: buffer,
            elevation: elevationData
        };

        thisPlugin.displayPortals(portalsInRange);
        thisPlugin.updateStatistics();
    };

    // Add these methods to handle elevation data
    thisPlugin.getElevationProfile = async function(routeGeometry) {
        // This would integrate with an elevation API
        // Returning mock data for now
        return {
            min: 0,
            max: 100,
            points: []
        };
    };

    thisPlugin.getRouteColor = function(feature, elevationData) {
        // Color route based on elevation/difficulty
        const slope = thisPlugin.calculateSlope(feature, elevationData);
        if (slope > 10) return '#FF0000'; // Steep
        if (slope > 5) return '#FFA500';  // Moderate
        return '#00FF00';                 // Easy
    };

    thisPlugin.calculateSlope = function(feature, elevationData) {
        // Calculate route segment slope
        return 0; // Mock implementation
    };

    // Enhanced UI with more detailed portal information
    thisPlugin.createPortalPopup = function(portal, distance) {
        const data = portal.options.data;
        const apPotential = thisPlugin.calculateAPPotential(portal);
        const xmCost = thisPlugin.calculateXMCost(portal);
        const xmGain = thisPlugin.calculateXMGain(portal);
        
        return `
            <div class="portal-popup">
                <h4>${data.title}</h4>
                <div class="portal-stats">
                    <div class="stat-row">
                        <span class="stat-label">Level:</span>
                        <span class="stat-value">${data.level}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Distance:</span>
                        <span class="stat-value">${distance}m</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Status:</span>
                        <span class="stat-value ${data.captured ? 'captured' : ''}">${data.captured ? 'Captured' : 'Not captured'}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Energy:</span>
                        <span class="stat-value">${data.energy}%</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Resonators:</span>
                        <span class="stat-value">${data.resCount}/8</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">AP Potential:</span>
                        <span class="stat-value">${apPotential.toLocaleString()}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">XM Balance:</span>
                        <span class="stat-value ${(xmGain - xmCost) >= 0 ? 'positive' : 'negative'}">
                            ${(xmGain - xmCost).toLocaleString()} (${xmGain}/${xmCost})
                        </span>
                    </div>
                </div>
            </div>
        `;
    };

    // Additional initialization code for enhanced features
    const originalInit = thisPlugin.init;
    thisPlugin.init = function() {
        originalInit.call(this);
        
        // Add enhanced styles
        $('<style>')
            .prop('type', 'text/css')
            .html(`
                .portal-popup .portal-stats {
                    display: grid;
                    gap: 5px;
                }
                .stat-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 2px 0;
                    border-bottom: 1px solid #eee;
                }
                .stat-label {
                    font-weight: bold;
                    color: #666;
                }
                .stat-value {
                    text-align: right;
                }
                .stat-value.positive {
                    color: #00aa00;
                }
                .stat-value.negative {
                    color: #aa0000;
                }
                .stat-value.captured {
                    color: #3366cc;
                }
                .route-optimization-controls {
                    margin-top: 10px;
                    padding: 10px;
                    background: #f5f5f5;
                    border-radius: 4px;
                }
                .optimization-button {
                    margin: 0 5px;
                    padding: 5px 10px;
                    border: none;
                    border-radius: 3px;
                    background: #4CAF50;
                    color: white;
                    cursor: pointer;
                }
                .optimization-button:hover {
                    background: #45a049;
                }
            `)
            .appendTo('head');
    };

    return thisPlugin;
}

// Inject plugin into page
var script = document.createElement('script');
script.appendChild(document.createTextNode('(' + wrapper + ')(' + JSON.stringify(plugin_info) + ');'));
(document.body || document.head || document.documentElement).appendChild(script);
