import {useRef, useMemo, useEffect, useState} from 'react'
import {useGraph} from '@react-three/fiber'
import {useGLTF, useAnimations} from '@react-three/drei'
import {SkeletonUtils} from 'three-stdlib'
import {OrbitControls} from '@react-three/drei'

import {MOUSE} from 'three/webgpu'

import type {
	Group,
	Mesh,
	BufferGeometry,
	Material,
	Skeleton,
	Object3D,
} from 'three/webgpu'

interface CharacterProps {
	actions: Record<string, unknown>
	state: string
}

type GLTFResult = {
	nodes: {
		mesh: Mesh & {
			geometry: BufferGeometry
			material: Material
			skeleton: Skeleton
		}
		mixamorig1Hips: Object3D
	}
	materials: {
		Ch36_Body: Material
	}
}

const Character = (props: CharacterProps) => {
	const group = useRef<Group>(null)
	const {scene, animations} = useGLTF('/models/char/round-one.glb')
	const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
	const {nodes, materials} = useGraph(clone) as unknown as GLTFResult
	const {actions} = useAnimations(animations, group)
	const [cameraTarget, setCameraTarget] = useState<[number, number, number]>([
		0, 0, 0,
	])
	const controls = {
		mouseButtons: {
			LEFT: undefined,
			MIDDLE: undefined,
			RIGHT: MOUSE.ROTATE,
		},
	}

	useEffect(() => {
		actions[props.state]?.reset().play()
	}, [actions, props.state])

	useEffect(() => {
		if (!group.current) return
		setCameraTarget([
			group.current.position.x,
			group.current.position.y + 1.4,
			group.current.position.z,
		])
	}, [])

	return (
		<>
			<OrbitControls
				target={cameraTarget}
				// zoomSpeed={0.8}
				dampingFactor={0.08}
				maxDistance={10}
				minDistance={1}
				minZoom={0.5}
				maxZoom={1}
				enablePan={false}
				mouseButtons={controls.mouseButtons}
			/>
			<group
				ref={group}
				{...props}
				dispose={null}
				rotation={[0, Math.PI / 2, 0]}
			>
				<group name='Scene'>
					<group
						name='character'
						rotation={[Math.PI / 2, 0, 0]}
						scale={0.01}
					>
						<primitive object={nodes.mixamorig1Hips} />
						<skinnedMesh
							name='mesh'
							geometry={nodes.mesh.geometry}
							material={materials.Ch36_Body}
							skeleton={nodes.mesh.skeleton}
						/>
					</group>
				</group>
			</group>
		</>
	)
}

useGLTF.preload('/models/char/round-one.glb')

export default Character
