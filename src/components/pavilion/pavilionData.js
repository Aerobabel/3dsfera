// Pavilion Data Structures
// Each pavilion contains company info and all associated products

const tractorVideoUrl = '/videos/Cyberpunk_Tractor_Video_Generation.mp4';
const logoVideoUrl = '/videos/Logo_Video_Generation.mp4';
import aeroWallUrl from '../../assets/images/aerowall.png';
import liftWallUrl from '../../assets/images/liftwall.png';
import cameralensUrl from '../../assets/images/cameralens.png';
import inspectorDroneUrl from '../../assets/images/inspectordrone.png';
import mobileCraneUrl from '../../assets/images/mobilecrane.png';
import klapanUrl from '../../assets/images/klapan.png';
import mobileGraderUrl from '../../assets/images/mobilegrader.png';
import pnemaPrivodUrl from '../../assets/images/pneuma2.png';
import kioskBiotechUrl from '../../assets/images/kiosk_biotech.png';
import kioskSecurityUrl from '../../assets/images/kiosk_security.png';

const TURBO_ENGINE_PATH = '/objects/turbo_schaft_engine_ivchenko_al-20.glb';
const PNEUMATIC_PATH = '/objects/Pneumatic.glb';
const CRANE_MACHINE_PATH = '/objects/optimized/crane_machine.glb';
const ROAD_GRADER_PATH = '/objects/optimized/road_grader.glb';
const VALVE_PATH = '/objects/valve.glb';
const CAMERA_PATH = '/objects/optimized/camera.glb';
const DRONE_PATH = '/objects/drone.glb';
const MICROSCOPE_PATH = '/objects/optimized/microscope.glb';
const SERVER_RACK_PATH = '/objects/network_server_rack.glb';

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
        name: 'W&T ENGINEERING',
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
                ],
                image: klapanUrl
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
                ],
                image: pnemaPrivodUrl
            },

        ]
    },
    'heavy': {
        id: 'heavy',
        name: 'TITAN HEAVY INDUSTRIES',
        slug: 'heavy',
        description: 'Vertical transportation solutions for modern infrastructure.',
        products: [
            {
                id: 'road_grader_Main',
                title: 'Mega-Grader 5000',
                name: 'Mega-Grader 5000',
                description: 'Advanced road grading machine with GPS-guided blade control and autonomous leveling systems. Perfect for high-speed highway construction.',
                price: '$210,000',
                modelPath: ROAD_GRADER_PATH,
                isRoboticArm: false,
                rotation: [0, -Math.PI / 4, 0],
                stats: {
                    weight: '18 Tons',
                    bladeWidth: '14 ft',
                    power: '250 HP'
                },
                features: [
                    { title: 'GPS Leveling', text: 'Precision grade control within 1mm.' },
                    { title: 'Articulated Frame', text: 'Superior maneuverability in tight spaces.' },
                    { title: 'Eco-Diesel Engine', text: 'High torque with low emissions.' }
                ],
                image: mobileGraderUrl
            },
            {
                id: 'mobile_crane_heavy',
                title: 'Mobile Crane MC-500',
                name: 'Mobile Crane MC-500',
                description: 'Heavy-duty mobile crane for construction and industrial applications. Diesel-electric hybrid power system for maximum efficiency.',
                price: '$850,000',
                modelPath: CRANE_MACHINE_PATH,
                stats: {
                    'Lift Capacity': '40 Tons',
                    'Boom Length': '32m',
                    'Power System': 'Diesel-Electric',
                    'Mobility': 'All-Terrain'
                },
                features: [
                    { title: '40 Ton Lift Capacity', text: 'Capable of lifting heavy loads.' },
                    { title: 'Hybrid Drive', text: 'Diesel-Electric system.' },
                    { title: '32m Boom', text: 'Extended telescopic range.' }
                ],
                image: mobileCraneUrl
            },

        ]
    },
    'logistics': {
        id: 'logistics',
        name: 'VELOCITY LOGISTICS',
        description: 'Advanced automated logistics and supply chain management solutions. Optimizing global trade with AI-driven sorting and pneumatics.',
        stats: {
            'Throughput': '10k/hr',
            'Accuracy': '99.99%',
            'Network': 'Global',
            'AI Core': 'Gen-5'
        },
        glowColor: '#00ff55',
        products: [
            {
                id: 'pneumatic_sorter',
                title: 'Pneumatic Sorter Unit',
                description: 'High-speed pneumatic diversion unit for automated conveyor systems. Handles up to 5000 units per hour with precise soft-touch actuation.',
                stats: {
                    'Speed': '5m/s',
                    'Pressure': '6 Bar',
                    'Response': '10ms',
                    'Rating': 'IP67'
                },
                modelPath: PNEUMATIC_PATH,
                scale: 1.2,
                position: [0, 0, 0],
                features: [
                    'Soft-Touch Diverter',
                    'Real-Time Tracking',
                    'Energy Efficient Air-Drive',
                    'Modular Design',
                    'Predictive Maintenance'
                ]
            }
        ]
    },
    'security': {
        id: 'security',
        name: 'AEGIS SECURITY',
        description: 'Next-generation surveillance and threat detection systems.',
        glowColor: '#e63946',
        products: [{
            id: 'sec_camera',
            title: 'AI Sentinel Camera',
            description: '360-degree autonomous surveillance unit with facial recognition.',
            stats: { 'Resolution': '8K', 'AI Model': 'Sentinel-V3', 'Vision': 'Night/Thermal' },
            modelPath: CAMERA_PATH,
            scale: 0.02, // Adjusted to visible size
            features: ['Facial Recognition', 'Motion Tracking', 'Thermal Vision'],
            image: cameralensUrl
        },
        ]
    },
    'data': {
        id: 'data',
        name: 'QUANTUM DATA CORP',
        description: 'Scalable cloud infrastructure and high-density server solutions.',
        glowColor: '#4361ee',
        products: [{
            id: 'server_blade',
            title: 'Quantum Server Rack',
            description: 'High-density liquid cooled server rack for AI training.',
            stats: { 'Cores': '1024', 'RAM': '4TB', 'Cooling': 'Liquid N2' },
            modelPath: SERVER_RACK_PATH,
            scale: 0.02, // Adjusted to visible size
            features: ['Liquid Cooling', 'Hot-Swappable', 'Quantum Ready']
        }]
    },
    'biotech': {
        id: 'biotech',
        name: 'GENESIS BIO-LABS',
        description: 'Precision laboratory equipment for genetic sequencing and analysis.',
        glowColor: '#2a9d8f',
        products: [{
            id: 'electron_microscope',
            title: 'Electron Microscope',
            description: 'High-resolution imaging for cellular analysis.',
            stats: { 'Magnification': '1,000,000x', 'Res': '0.1nm', 'Type': 'TEM' },
            modelPath: MICROSCOPE_PATH,
            scale: 0.02, // Adjusted to visible size
            features: ['Atomic Resolution', 'Auto-Focus', 'Cloud Analysis'],
            image: kioskBiotechUrl
        },
        ]
    },
    'ai_systems': {
        id: 'ai_systems',
        name: 'SYNTHETIC MINDS',
        description: 'Autonomous drones and robotic systems for industrial automation.',
        glowColor: '#caf0f8',
        products: [{
            id: 'ind_drone',
            title: 'Inspector Drone X1',
            description: 'Autonomous inspection drone for hazardous environments.',
            stats: { 'Flight Time': '45m', 'Range': '5km', 'Sensors': 'Lidar/RGB' },
            modelPath: DRONE_PATH,
            scale: 0.02, // Adjusted to visible size
            rotation: [0, Math.PI, 0],
            features: ['Obstacle Avoidance', 'Auto-Docking', 'Swarm Capable'],
            image: inspectorDroneUrl
        }]
    }
};
