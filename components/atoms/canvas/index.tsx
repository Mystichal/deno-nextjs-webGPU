export const Canvas = (
	ref: React.RefObject<HTMLCanvasElement>,
	props: React.HTMLAttributes<HTMLCanvasElement>,
) => {
	return <canvas ref={ref} {...props} className='block w-full h-full' />
}

Canvas.displayName = 'Canvas'
