import type {NextConfig} from 'next'

const securityHeaders = [
	{key: 'X-Frame-Options', value: 'DENY'},
	{key: 'X-Content-Type-Options', value: 'nosniff'},
	{key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
	{
		key: 'Permissions-Policy',
		value: 'camera=(), microphone=(), geolocation=()',
	},
	{key: 'X-XSS-Protection', value: '1; mode=block'},
]

const nextConfig: NextConfig = {
	output: 'standalone',
	allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(',') || [],
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: securityHeaders,
			},
		]
	},
}

export default nextConfig
