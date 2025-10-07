import {Canvas} from '@react-three/fiber'
import {useRef, useState} from 'react'
import * as THREE from 'three/webgpu'
import ResizeHandler from '@/components/atoms/resizeHandler'

const GameCanvas = ({
	quality,
	children,
}: {
	quality: string
	children: React.ReactNode
}) => {
	const rendererRef = useRef<THREE.WebGPURenderer>(null)
	const [frameloop, setFrameloop] = useState<'always' | 'demand' | 'never'>(
		'never',
	)

	return (
		<Canvas
			onCreated={state => {
				state.setSize(window.innerWidth, window.innerHeight)
			}}
			frameloop={frameloop}
			dpr={quality === 'default' ? 1 : [1, 1.5]}
			camera={{
				position: [18.6, -0.6, 0],
				near: 0.1,
				far: 50,
				fov: 65,
				// zoom: 1,
			}}
			shadows={'variance'}
			gl={props => {
				const renderer = new THREE.WebGPURenderer({
					canvas: props.canvas as HTMLCanvasElement,
					antialias: true,
					alpha: false,
					stencil: false,
				})

				// Initialize WebGPU and store renderer reference
				renderer.init().then(() => setFrameloop('always'))
				rendererRef.current = renderer
				return renderer
			}}
		>
			<ResizeHandler rendererRef={rendererRef} />
			{children}
		</Canvas>
	)
}

export default GameCanvas
