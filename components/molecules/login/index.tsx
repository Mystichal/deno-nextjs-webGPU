'use client'

import {useState} from 'react'

export const Login = ({
	onLogin,
}: {
	onLogin: (username: string, password: string) => void
}) => {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')

	return (
		<div>
			<input
				type='text'
				value={username}
				onChange={e => setUsername(e.target.value)}
			/>
			<input
				type='password'
				value={password}
				onChange={e => setPassword(e.target.value)}
			/>
			<button type='button' onClick={() => onLogin(username, password)}>
				Login
			</button>
		</div>
	)
}
