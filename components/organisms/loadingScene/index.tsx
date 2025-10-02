'use client'

import {useEffect, useRef} from 'react'
import {createSphere} from '@/components/organisms/createSphere'

export const LoadingScene = ({
	width = 800,
	height = 600,
}: {
	width?: number
	height?: number
}) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const stopRef = useRef(false)

	useEffect(() => {
		stopRef.current = false
		const init = async () => {
			if (!navigator.gpu) {
				console.warn('WebGPU not supported in this browser.')
				return
			}

			const adapter = await navigator.gpu.requestAdapter()
			if (!adapter) {
				console.warn('No GPU adapter available.')
				return
			}

			const device = await adapter.requestDevice()
			const canvas = canvasRef.current
			if (!canvas) return

			canvas.width = width
			canvas.height = height

			const context = canvas.getContext(
				'webgpu',
			) as GPUCanvasContext | null

			if (!context) {
				console.warn('Failed to get webgpu context')
				return
			}

			const format = navigator.gpu.getPreferredCanvasFormat()
			context.configure({device, format, alphaMode: 'opaque'})

			// -------------------
			// Geometry
			// -------------------
			const {positions, indices} = createSphere(64, 64, 0.9)

			const posBuf = device.createBuffer({
				size: positions.byteLength,
				usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
				mappedAtCreation: true,
			})
			new Float32Array(posBuf.getMappedRange()).set(positions)
			posBuf.unmap()

			const idxBuf = device.createBuffer({
				size: indices.byteLength,
				usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
				mappedAtCreation: true,
			})
			new Uint16Array(idxBuf.getMappedRange()).set(indices)
			idxBuf.unmap()

			// -------------------
			// Shaders (fixed WGSL syntax)
			// -------------------
			const sceneWGSL = `
				struct VSOut {
					@builtin(position) Position : vec4f,
					@location(0) vPos : vec3f
				};

				@vertex fn vs_main(@location(0) pos : vec3f) -> VSOut {
					var out : VSOut;
					// static rotation for loading screen
					let p = pos * 0.7;
					out.Position = vec4f(p, 1.0);
					out.vPos = pos;
					return out;
				}

				fn hash(p: vec3f) -> f32 {
					return fract(sin(dot(p, vec3f(12.9898,78.233,37.719))) * 43758.5453);
				}

				@fragment fn fs_main(in_ : VSOut) -> @location(0) vec4f {
					let n = hash(in_.vPos * 6.0);
					let clouds = smoothstep(0.35, 0.65, n);
					let col = mix(vec3f(0.08,0.1,0.14), vec3f(0.9,0.92,1.0), clouds);
					return vec4f(col, 1.0);
				}
			`

			const postWGSL = `
				@group(0) @binding(0) var mySampler: sampler;
				@group(0) @binding(1) var myTex: texture_2d<f32>;

				struct VSOut {
					@builtin(position) Position : vec4f,
					@location(0) uv : vec2f
				};

				@vertex fn vs_main(@builtin(vertex_index) vi : u32) -> VSOut {
					var pos = array<vec2f, 6>(
					vec2f(-1.0, -1.0),
					vec2f(1.0, -1.0),
					vec2f(-1.0, 1.0),
					vec2f(-1.0, 1.0),
					vec2f(1.0, -1.0),
					vec2f(1.0, 1.0)
					);
					var out : VSOut;
					out.Position = vec4<f32>(pos[vi], 0.0, 1.0);
					out.uv = (pos[vi] + vec2<f32>(1.0, 1.0)) * 0.5;
					return out;
				}

				@fragment fn fs_main(in_ : VSOut) -> @location(0) vec4<f32> {
					let lightPos = vec2<f32>(0.5, 0.45);
					var result = textureSample(myTex, mySampler, in_.uv).rgb;
					let samples = 30u;
					var decay = 0.92;
					var exposure = 0.25;
					var illum = 1.0;
					var delta = (lightPos - in_.uv) / f32(samples);
					var coord = in_.uv;
					for (var i: u32 = 0u; i < samples; i = i + 1u) {
					coord = coord + delta;
					let s = textureSample(myTex, mySampler, coord).rgb;
					result = result + s * illum;
					illum = illum * decay;
					}
					result = result * exposure + textureSample(myTex, mySampler, in_.uv).rgb * 0.6;
					return vec4<f32>(result, 1.0);
				}
			`

			const shader = device.createShaderModule({code: sceneWGSL})
			const postShader = device.createShaderModule({code: postWGSL})

			// diagnostics: print compilation info for both shaders
			try {
				const info = await shader.getCompilationInfo()
				if (info.messages.length) {
					console.group('Scene shader compilation messages')
					info.messages.forEach(m => console.warn(m))
					console.groupEnd()
				}
			} catch (e) {
				console.warn(
					'Unable to get compilation info for scene shader',
					e,
				)
			}

			try {
				const info = await postShader.getCompilationInfo()
				if (info.messages.length) {
					console.group('Post shader compilation messages')
					info.messages.forEach(m => console.warn(m))
					console.groupEnd()
				}
			} catch (e) {
				console.warn(
					'Unable to get compilation info for post shader',
					e,
				)
			}

			// -------------------
			// Pipelines (catch creation errors)
			// -------------------
			let pipeline: GPURenderPipeline
			let postPipeline: GPURenderPipeline
			try {
				pipeline = device.createRenderPipeline({
					layout: 'auto',
					vertex: {
						module: shader,
						entryPoint: 'vs_main',
						buffers: [
							{
								arrayStride: 12,
								attributes: [
									{
										format: 'float32x3',
										offset: 0,
										shaderLocation: 0,
									},
								],
							},
						],
					},
					fragment: {
						module: shader,
						entryPoint: 'fs_main',
						targets: [{format: 'rgba16float'}],
					},
					primitive: {topology: 'triangle-list'},
				})
			} catch (err) {
				console.error('Failed to create scene pipeline', err)
				return
			}

			try {
				postPipeline = device.createRenderPipeline({
					layout: 'auto',
					vertex: {module: postShader, entryPoint: 'vs_main'},
					fragment: {
						module: postShader,
						entryPoint: 'fs_main',
						targets: [{format}],
					},
					primitive: {topology: 'triangle-list'},
				})
			} catch (err) {
				console.error('Failed to create post pipeline', err)
				return
			}

			// -------------------
			// Offscreen texture + bind group
			// -------------------
			const tex = device.createTexture({
				size: [canvas.width, canvas.height],
				format: 'rgba16float',
				usage:
					GPUTextureUsage.RENDER_ATTACHMENT |
					GPUTextureUsage.TEXTURE_BINDING,
			})
			const sceneView = tex.createView()

			const sampler = device.createSampler({
				magFilter: 'linear',
				minFilter: 'linear',
			})

			const bindGroup = device.createBindGroup({
				layout: postPipeline.getBindGroupLayout(0),
				entries: [
					{binding: 0, resource: sampler},
					{binding: 1, resource: sceneView},
				],
			})

			// -------------------
			// Render pass descriptors
			// -------------------
			const passDesc: GPURenderPassDescriptor = {
				colorAttachments: [
					{
						view: sceneView,
						clearValue: {r: 0, g: 0, b: 0, a: 1},
						loadOp: 'clear',
						storeOp: 'store',
					},
				],
			}

			const postColorAttachment: GPURenderPassColorAttachment = {
				view: undefined as unknown as GPUTextureView,
				clearValue: {r: 0, g: 0, b: 0, a: 1},
				loadOp: 'clear',
				storeOp: 'store',
			}

			const postPassDesc: GPURenderPassDescriptor = {
				colorAttachments: [postColorAttachment],
			}

			// -------------------
			// Frame loop
			// -------------------
			const frame = () => {
				if (stopRef.current) return

				const enc = device.createCommandEncoder()

				// pass 1: render sphere into offscreen texture
				{
					const p = enc.beginRenderPass(passDesc)
					p.setPipeline(pipeline)
					p.setVertexBuffer(0, posBuf)
					p.setIndexBuffer(idxBuf, 'uint16')
					p.drawIndexed(indices.length, 1, 0, 0, 0)
					p.end()
				}

				// pass 2: blit / postprocess to swapchain
				postColorAttachment.view = context
					.getCurrentTexture()
					.createView()
				{
					const p = enc.beginRenderPass(postPassDesc)
					p.setPipeline(postPipeline)
					p.setBindGroup(0, bindGroup)
					p.draw(6, 1, 0, 0)
					p.end()
				}

				device.queue.submit([enc.finish()])
				requestAnimationFrame(frame)
			}

			requestAnimationFrame(frame)
		}

		init()

		return () => {
			stopRef.current = true
		}
		// intentionally exclude stopRef — it is stable
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [width, height])

	return <canvas ref={canvasRef} style={{width, height}} />
}
