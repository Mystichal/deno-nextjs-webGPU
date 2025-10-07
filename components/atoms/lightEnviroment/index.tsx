import {Environment} from '@react-three/drei'

const LightEnviroment = () => {
	return (
		<>
			<directionalLight
				position={[-0.7, 1.8, 0.1]}
				intensity={6}
				castShadow
				shadow-mapSize={[128, 128]}
				shadow-camera-near={2}
				shadow-camera-far={100}
				shadow-camera-top={3}
				shadow-camera-right={3}
				shadow-camera-bottom={-3}
				shadow-camera-left={-3}
				shadow-bias={-0.002}
			/>
			<Environment
				preset='warehouse'
				environmentIntensity={0.2}
				environmentRotation={[0.4, 0, 1.4]}
			/>
		</>
	)
}

export default LightEnviroment
