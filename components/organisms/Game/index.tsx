'use client'

import {useState} from 'react'
import {Loader} from '@react-three/drei'
import GameCanvas from '@/components/molecules/gameCanvas'
import LightEnviroment from '@/components/atoms/lightEnviroment'
import Character from '@/components/atoms/character'
import PostProcessing from '@/components/atoms/postProcessing'

type Quality = 'default' | 'high' | 'ultra'
type CharacterState = 'idle' | 'walk' | 'run' | 'jump' | 'attack' | 'die'

const Game = () => {
	const [quality, setQuality] = useState<Quality>('default')
	const [isPostProcessingEnabled, setIsPostProcessingEnabled] = useState(true)
	const [characterState, setCharacterState] = useState<CharacterState>('idle')

	return (
		<>
			<Loader />

			<GameCanvas quality={quality}>
				<color attach='background' args={['black']} />

				{isPostProcessingEnabled && (
					<PostProcessing strength={0.25} radius={0.1} />
				)}

				<LightEnviroment />

				<Character actions={{}} state={characterState} />
			</GameCanvas>
		</>
	)
}

export default Game
