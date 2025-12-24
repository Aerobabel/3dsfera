// Pavilion Data Structures
// Each pavilion contains company info and all associated products

import tractorVideoUrl from '../../assets/videos/Cyberpunk_Tractor_Video_Generation.mp4';
import logoVideoUrl from '../../assets/videos/Logo_Video_Generation.mp4';
import aeroWallUrl from '../../assets/images/aerowall.png';
import liftWallUrl from '../../assets/images/liftwall.png';

const TURBO_ENGINE_PATH = '/objects/turbo_schaft_engine_ivchenko_al-20.glb';
const CRANE_MACHINE_PATH = '/objects/crane_machine.glb';
const VALVE_PATH = '/objects/valve.glb';

export const PAVILIONS = {
    '3dsfera': {
        id: '3dsfera',
        name: '3DSFERA',
        description: 'Leading digital marketplace connecting buyers and verified suppliers across 140 countries. Our platform specializes in industrial equipment, aerospace components, and heavy machinery with industry-leading reliability and support.',
        stats: {
            'Global Reach': '140 Countries',
            'Product SKUs': '2.4M',
            'Platform Uptime': '99.9%',
            'Verified Suppliers': '50k+'
        },
        glowColor: '#00ffff',
        videoUrl: logoVideoUrl,
        products: [
            {
                id: 'platform_demo',
                title: 'Platform Demo',
                description: '3D visualization platform for industrial equipment showcasing and virtual trade shows.',
                stats: {
                    'Active Users': '500k+',
                    'Uptime': '99.99%',
                    'Integrations': 'API/ERP'
                },
                modelPath: null,
                position: [0, 0, 0]
            }
        ]
    },
    'aero': {
        id: 'aero',
        name: 'AERO DYNAMICS',
        description: 'Specialized manufacturer of high-performance turbine engines and precision valves for aerospace and industrial applications. Engineering excellence since 1987.',
        stats: {
            'Engine Thrust': '240kN',
            'Efficiency Rating': '94%',
            'Global Installations': '12,000+',
            'ISO Certified': 'AS9100D'
        },
        glowColor: '#ff0055',
        imageUrl: aeroWallUrl,
        products: [
            {
                id: 'turbine_valve',
                title: 'High-Temp Turbine Valve',
                description: 'Precision-engineered valve designed for extreme temperature turbine applications. Titanium-X alloy construction ensures maximum durability and reliability.',
                stats: {
                    'Max Temperature': '2500°C',
                    'Material': 'Titanium-X Alloy',
                    'Warranty': '5000 Flight Hours',
                    'Pressure Rating': '250 Bar'
                },
                modelPath: VALVE_PATH,
                scale: 0.15,
                position: [0, 0, 0]
            },
            {
                id: 'turbo_engine',
                title: 'AL-20 Turboshaft Engine',
                description: 'Advanced turboshaft engine with exceptional power-to-weight ratio. Proven performance in demanding aerospace applications.',
                stats: {
                    'Power Output': '240kN',
                    'Weight': '850kg',
                    'Fuel Efficiency': '94%',
                    'TBO': '6000 Hours'
                },
                modelPath: TURBO_ENGINE_PATH,
                scale: 0.8,
                position: [5, 0, 0]
            }
        ]
    },
    'heavy': {
        id: 'heavy',
        name: 'HEAVY LIFT INC',
        description: 'Global leader in heavy machinery and industrial robotics. Providing cutting-edge lifting solutions and automation systems for construction, mining, and manufacturing industries.',
        stats: {
            'Max Load Capacity': '500 Tons',
            'Boom Reach': '120m',
            'Safety Rating': 'A+',
            'Projects Completed': '8,500+'
        },
        glowColor: '#ffaa00',
        imageUrl: liftWallUrl,
        products: [
            {
                id: 'robotic_arm',
                title: '6-Axis Industrial Robot',
                description: 'State-of-the-art robotic arm with exceptional precision and payload capacity. Perfect for automated manufacturing and assembly lines.',
                stats: {
                    'Payload': '2.3 Tons',
                    'Degrees of Freedom': '6-Axis',
                    'Repeatability': '±0.1mm',
                    'Reach': '3.2m'
                },
                modelPath: null,
                isRoboticArm: true,
                position: [0, 0, 0]
            },
            {
                id: 'mobile_crane',
                title: 'Mobile Crane MC-500',
                description: 'Heavy-duty mobile crane for construction and industrial applications. Diesel-electric hybrid power system for maximum efficiency.',
                stats: {
                    'Lift Capacity': '40 Tons',
                    'Boom Length': '32m',
                    'Power System': 'Diesel-Electric',
                    'Mobility': 'All-Terrain'
                },
                modelPath: CRANE_MACHINE_PATH,
                scale: 0.35,
                position: [-5, 0, 0]
            }
        ]
    }
};
