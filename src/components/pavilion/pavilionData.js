// Pavilion Data Structures
// Each pavilion contains company info and all associated products

import tractorVideoUrl from '../../assets/videos/Cyberpunk_Tractor_Video_Generation.mp4';
import logoVideoUrl from '../../assets/videos/Logo_Video_Generation.mp4';
import aeroWallUrl from '../../assets/images/aerowall.png';
import liftWallUrl from '../../assets/images/liftwall.png';

const TURBO_ENGINE_PATH = '/objects/turbo_schaft_engine_ivchenko_al-20.glb'; // Kept for reference or removal
const PNEUMATIC_PATH = '/objects/Pneumatic.glb';
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
                id: 'smart_microwave',
                title: 'Smart Inverter Microwave',
                description: 'Next-gen kitchen appliance with AI cooking sensors and rapid defrost technology. Sleek stainless steel finish.',
                stats: {
                    'Power': '1200W',
                    'Capacity': '2.2 cu ft',
                    'Sensors': 'Humidity/Temp'
                },
                modelPath: null,
                isMicrowave: true,
                scale: 1.0,
                position: [0, 0, 0],
                features: [
                    'AI Cooking Sensors',
                    'Smart Inverter Technology',
                    'EasyClean Antibacterial Coating',
                    'Hexagonal Stable Ring',
                    'Bright LED Interior Light'
                ]
            },
            {
                id: 'oled_tv',
                title: '65" 4K OLED TV',
                description: 'Ultra-thin bezel-less display with infinite contrast and cinematic color accuracy.',
                stats: {
                    'Resolution': '3840 x 2160',
                    'Panel Type': 'OLED',
                    'Refresh Rate': '120Hz'
                },
                modelPath: null,
                isTelevision: true,
                scale: 1.2,
                position: [5, 0, 0],
                features: [
                    'Self-lit OLED Pixels',
                    'α9 Gen5 AI Processor 4K',
                    'Dolby Vision IQ & Dolby Atmos',
                    'NVIDIA G-SYNC Compatible',
                    'ThinQ AI with Voice Control'
                ]
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
                scale: 0.9,
                position: [0, 0, 0],
                features: [
                    'Titanium-X Alloy Body',
                    'Thermal Shock Resistance',
                    'Precision Flow Control',
                    '2500°C Max Operating Temp',
                    'ISO 9001 Certified'
                ]
            },
            {
                id: 'pneumatic_system',
                title: 'Industrial Pneumatic Actuator',
                description: 'Heavy-duty pneumatic control system for high-pressure industrial airflow management. Engineered for rapid response and extreme durability.',
                stats: {
                    'Max Pressure': '350 Bar',
                    'Actuation Time': '0.05s',
                    'Cycle Life': '10M Cycles',
                    'Material': 'Stainless 316L'
                },
                modelPath: PNEUMATIC_PATH,
                scale: 1.3,
                rotation: [0, 1.57, 0],
                position: [5, 0, 0],
                features: [
                    'Heavy-Duty Stainless Steel 316L',
                    'Rapid Response Actuation (0.05s)',
                    'High Pressure Tolerance (350 Bar)',
                    'Corrosion Resistant Coating',
                    'Integrated Position Feedback'
                ]
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
                position: [0, 0, 0],
                features: [
                    '6-Axis Freedom of Movement',
                    '2.3 Ton Payload Capacity',
                    'Sub-millimeter Precision',
                    'Integrated Vision System',
                    'IP67 Rated Protection'
                ]
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
                scale: 1.1,
                position: [-5, 0, 0],
                features: [
                    '40 Ton Lift Capacity',
                    'Hybrid Diesel-Electric Drive',
                    '32m Telescopic Boom',
                    '360° Continuous Rotation',
                    'Advanced Load Moment Limiter'
                ]
            }
        ]
    }
};
