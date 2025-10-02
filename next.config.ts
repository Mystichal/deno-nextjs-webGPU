import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
	output: 'standalone',
	allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(',') || [],
}

export default nextConfig
