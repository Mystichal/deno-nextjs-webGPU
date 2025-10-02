'use client'

export const createSphere = (
	latitudeBands = 32,
	longitudeBands = 32,
	radius = 1,
) => {
	const positions: number[] = []
	const indices: number[] = []

	for (let lat = 0; lat <= latitudeBands; lat++) {
		const theta = (lat * Math.PI) / latitudeBands
		const sinTheta = Math.sin(theta)
		const cosTheta = Math.cos(theta)

		for (let lon = 0; lon <= longitudeBands; lon++) {
			const phi = (lon * 2 * Math.PI) / longitudeBands
			const sinPhi = Math.sin(phi)
			const cosPhi = Math.cos(phi)

			const x = cosPhi * sinTheta
			const y = cosTheta
			const z = sinPhi * sinTheta
			positions.push(x * radius, y * radius, z * radius)
		}
	}

	for (let lat = 0; lat < latitudeBands; lat++) {
		for (let lon = 0; lon < longitudeBands; lon++) {
			const first = lat * (longitudeBands + 1) + lon
			const second = first + longitudeBands + 1

			indices.push(first, second, first + 1, second + 1, first + 1)
		}
	}

	return {
		positions: new Float32Array(positions),
		indices: new Uint16Array(indices),
	}
}
