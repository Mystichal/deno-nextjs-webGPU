import * as THREE from 'three/webgpu'
import {
	pass,
	mrt,
	output,
	transformedNormalView,
	metalness,
	emissive,
} from 'three/tsl'
import {bloom} from 'three/addons/tsl/display/BloomNode.js'
import {smaa} from 'three/addons/tsl/display/SMAANode.js'
import {useThree, useFrame} from '@react-three/fiber'
import {useEffect, useRef} from 'react'

interface Props {
	strength?: number
	radius?: number
}

const PostProcessing = ({strength = 2.5, radius = 0.5}: Props) => {
	const {gl: renderer, scene, camera} = useThree()
	const postProcessingRef = useRef<THREE.PostProcessing | null>(null)

	useEffect(() => {
		if (!renderer || !scene || !camera) return

		// Create post-processing setup with specific filters
		const scenePass = pass(scene, camera, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
		})

		// Setup Multiple Render Targets (MRT)
		scenePass.setMRT(
			mrt({
				output: output,
				normal: transformedNormalView,
				metalness: metalness,
				emissive: emissive,
			}),
		)

		// Get texture nodes
		const scenePassColor = scenePass.getTextureNode('output')
		const scenePassEmissive = scenePass.getTextureNode('emissive')

		// Create bloom pass
		const bloomPass = bloom(scenePassEmissive, strength, radius, 0.6)

		// Blend SSR over beauty with SMAA
		const outputNode = smaa(scenePassColor.add(bloomPass))

		// Setup post-processing
		const postProcessing = new THREE.PostProcessing(
			renderer as unknown as THREE.WebGPURenderer,
		)
		postProcessing.outputNode = outputNode
		postProcessingRef.current = postProcessing

		return () => {
			postProcessingRef.current = null
		}
	}, [renderer, scene, camera, strength, radius])

	useFrame(({gl}) => {
		if (postProcessingRef.current) {
			gl.clear()
			postProcessingRef.current.render()
		}
	}, 1)

	return null
}

export default PostProcessing
