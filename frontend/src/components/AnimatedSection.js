import React from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@mui/system';

function AnimatedSection({ children, sx = {}, enableParallax = true, blur = 24, hueDurationSec = 30 }) {
	const floatSlow = keyframes`
		0% { transform: translate3d(0, 0, 0) scale(1); }
		50% { transform: translate3d(3%, -4%, 0) scale(1.05); }
		100% { transform: translate3d(0, 0, 0) scale(1); }
	`;

	const floatAlt = keyframes`
		0% { transform: translate3d(0, 0, 0) scale(1); }
		50% { transform: translate3d(-4%, 3%, 0) scale(1.03); }
		100% { transform: translate3d(0, 0, 0) scale(1); }
	`;

	const hueShift = keyframes`
		0% { filter: hue-rotate(0deg); }
		100% { filter: hue-rotate(360deg); }
	`;

	const [parallax, setParallax] = React.useState({ x: 0, y: 0 });

	const handleMouseMove = (event) => {
		if (!enableParallax) return;
		const rect = event.currentTarget.getBoundingClientRect();
		const x = (event.clientX - rect.left) / rect.width - 0.5;
		const y = (event.clientY - rect.top) / rect.height - 0.5;
		setParallax({ x, y });
	};

	return (
		<Box
			onMouseMove={handleMouseMove}
			sx={{
				position: 'relative',
				overflow: 'hidden',
				borderRadius: 4,
				...sx,
			}}
		>
			{/* Animated gradient blobs */}
			<Box
				aria-hidden
				sx={(theme) => ({
					position: 'absolute',
					inset: 0,
					opacity: theme.palette.mode === 'light' ? 0.5 : 0.3,
					pointerEvents: 'none',
					backgroundImage: `
						radial-gradient(40% 60% at 20% 10%, ${theme.palette.primary.main}33, transparent 60%),
						radial-gradient(50% 70% at 80% 30%, ${theme.palette.secondary.main}33, transparent 60%),
						radial-gradient(60% 50% at 50% 90%, ${theme.palette.success?.main || '#22c55e'}33, transparent 60%)
					`,
					filter: `blur(${blur}px)`,
					animation: `${hueShift} ${hueDurationSec}s linear infinite`,
				})}
			/>
			<Box
				aria-hidden
				sx={(theme) => ({
					position: 'absolute',
					top: '-20%',
					left: '-10%',
					width: '50%',
					height: '80%',
					background: `radial-gradient(closest-side, ${theme.palette.primary.main}22, transparent)`,
					filter: 'blur(20px)',
					animation: `${floatSlow} 16s ease-in-out infinite`,
					transform: `translate3d(${parallax.x * 12}px, ${parallax.y * 12}px, 0)`,
				})}
			/>
			<Box
				aria-hidden
				sx={(theme) => ({
					position: 'absolute',
					bottom: '-15%',
					right: '-10%',
					width: '45%',
					height: '70%',
					background: `radial-gradient(closest-side, ${theme.palette.secondary.main}22, transparent)`,
					filter: 'blur(22px)',
					animation: `${floatAlt} 18s ease-in-out infinite`,
					transform: `translate3d(${parallax.x * -10}px, ${parallax.y * -10}px, 0)`,
				})}
			/>
			{/* Subtle grid overlay */}
			<Box
				aria-hidden
				sx={(theme) => ({
					position: 'absolute',
					inset: 0,
					backgroundImage: `
						linear-gradient(0deg, ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)'} 1px, transparent 1px),
						linear-gradient(90deg, ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'} 1px, transparent 1px)
					`,
					backgroundSize: '24px 24px',
					maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)',
					WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)',
					opacity: 0.4,
				})}
			/>

			{/* Content */}
			<Box sx={{ position: 'relative', zIndex: 1 }}>
				{children}
			</Box>
		</Box>
	);
}

export default AnimatedSection;












