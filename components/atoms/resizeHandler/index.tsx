import {useEffect} from 'react'
import type {WebGPURenderer} from 'three/webgpu'

interface ResizeHandlerProps {
	rendererRef: React.RefObject<WebGPURenderer | null>
}

const ResizeHandler = ({rendererRef}: ResizeHandlerProps) => {
	useEffect(() => {
		const handleResize = () => {
			if (rendererRef.current) {
				rendererRef.current.setSize(
					window.innerWidth,
					window.innerHeight,
				)
			}
		}

		window.addEventListener('resize', handleResize)

		// Cleanup
		return () => window.removeEventListener('resize', handleResize)
	}, [rendererRef.current])

	return null
}

export default ResizeHandler
