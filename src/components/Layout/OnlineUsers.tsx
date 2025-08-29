"use client";

import { useState, useEffect } from 'react';
import { PUBLIC_API_URL } from "@/utils/api";
import Image from 'next/image';
import { Skeleton } from '@mui/material';
import Link from 'next/link';

interface OnlineUser {
	id: string;
	username: string;
	global_name: string;
	avatar: string;
	created_at: string;
	premiumtype: number;
	usernumber: number;
	last_seen: number;
}

interface OnlineUsersProps {
	max?: number;
	className?: string;
}

export default function OnlineUsers({ max = 4, className = '', initial }: OnlineUsersProps & { initial?: OnlineUser[] }) {
	const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>(initial || []);
	const [loading, setLoading] = useState(!(initial && initial.length > 0));
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchOnlineUsers = async () => {
			try {
				setLoading(false);
				setError(null);
				
				const response = await fetch(`${PUBLIC_API_URL}/users/list/online`);
				
				if (!response.ok) {
					throw new Error('Failed to fetch online users');
				}
				
				const data = await response.json();
				setOnlineUsers(data);
			} catch (err) {
				console.error('Error fetching online users:', err);
				setError('Failed to load online users');
			} finally {
				setLoading(false);
			}
		};

		if (!initial || initial.length === 0) {
			fetchOnlineUsers();
		}

		// Refresh every 30 seconds
		const interval = setInterval(fetchOnlineUsers, 30000);
		return () => clearInterval(interval);
	}, [initial]);

	if (loading) {
		return (
			<div className={`flex items-center space-x-2 ${className}`}>
				<div className="flex -space-x-2">
					{[...Array(max)].map((_, i) => (
						<Skeleton
							key={i}
							variant="circular"
							width={32}
							height={32}
							sx={{ 
								bgcolor: '#2E3944',
								border: '2px solid #212A31'
							}}
						/>
					))}
				</div>
				<span className="text-sm text-[#B9BBBE]">Loading online users...</span>
			</div>
		);
	}

	if (error || onlineUsers.length === 0) {
		return null; // Don't show anything if there's an error or no users
	}

	const visibleUsers = onlineUsers.slice(0, max);
	const totalUsers = onlineUsers.length;
	const hiddenCount = totalUsers - max;

	return (
		<div className={`flex items-center space-x-2 ${className}`}>
			<div className="flex -space-x-2">
				{visibleUsers.map((user, index) => (
					<Link
						key={user.id}
						href={`/users/${user.id}`}
						className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-[#212A31] hover:border-[#5865F2] transition-colors cursor-pointer"
						style={{ zIndex: visibleUsers.length - index }}
					>
						{user.avatar && user.avatar !== "None" ? (
							<Image
								src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}?size=128`}
								alt={`${user.username}'s avatar`}
								fill
								className="object-cover"
								draggable={false}
							/>
						) : (
							<div className="w-full h-full bg-[#2E3944] flex items-center justify-center">
								<svg
									className="w-4 h-4 text-[#B9BBBE]"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<circle cx="12" cy="12" r="12" fill="#2E3944" />
									<path
										d="M12 13.5C14.4853 13.5 16.5 11.4853 16.5 9C16.5 6.51472 14.4853 4.5 12 4.5C9.51472 4.5 7.5 6.51472 7.5 9C7.5 11.4853 9.51472 13.5 12 13.5Z"
										fill="#d3d9d4"
									/>
									<path
										d="M12 15C8.13401 15 5 18.134 5 22H19C19 18.134 15.866 15 12 15Z"
										fill="#d3d9d4"
									/>
								</svg>
							</div>
						)}
					</Link>
				))}
				{hiddenCount > 0 && (
					<div
						className="relative w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-xs font-medium border-2 border-[#212A31]"
						style={{ zIndex: 0 }}
					>
						+{hiddenCount}
					</div>
				)}
			</div>
			<span className="text-sm text-[#B9BBBE]">
				{totalUsers} online
			</span>
		</div>
	);
} 