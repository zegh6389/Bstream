"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

interface TabsProps extends React.ComponentProps<typeof TabsPrimitive.Root> {
	/**
	 * Orientation of the tabs
	 */
	orientation?: "horizontal" | "vertical"
}

const Tabs = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Root>,
	TabsProps
>(({ className, orientation = "horizontal", ...props }, ref) => (
	<TabsPrimitive.Root
		ref={ref}
		orientation={orientation}
		className={cn(
			"flex gap-2",
			orientation === "horizontal" ? "flex-col" : "flex-row",
			className
		)}
		{...props}
	/>
))
Tabs.displayName = "Tabs"

interface TabsListProps
	extends React.ComponentProps<typeof TabsPrimitive.List> {
	/**
	 * Whether the tabs list should take full width
	 */
	fullWidth?: boolean
}

const TabsList = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.List>,
	TabsListProps
>(({ className, fullWidth = false, ...props }, ref) => (
	<TabsPrimitive.List
		ref={ref}
		className={cn(
			[
				"inline-flex items-center justify-center rounded-lg bg-muted text-muted-foreground p-1",
				"ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
			],
			fullWidth && "w-full",
			className
		)}
		{...props}
	/>
))
TabsList.displayName = "TabsList"

interface TabsTriggerProps
	extends React.ComponentProps<typeof TabsPrimitive.Trigger> {
	/**
	 * Icon to display alongside the tab text
	 */
	icon?: React.ReactNode
}

const TabsTrigger = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Trigger>,
	TabsTriggerProps
>(({ className, icon, children, ...props }, ref) => (
	<TabsPrimitive.Trigger
		ref={ref}
		className={cn(
			[
				"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5",
				"text-sm font-medium ring-offset-background transition-all",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
				"disabled:pointer-events-none disabled:opacity-50",
				// Enhanced active state styling
				"data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
				"hover:bg-muted/50 hover:text-foreground",
				// Icon styling
				"[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
			],
			className
		)}
		{...props}
	>
		{icon}
		{children}
	</TabsPrimitive.Trigger>
))
TabsTrigger.displayName = "TabsTrigger"

interface TabsContentProps
	extends React.ComponentProps<typeof TabsPrimitive.Content> {
	/**
	 * Whether to add padding to the content
	 */
	padded?: boolean
}

const TabsContent = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Content>,
	TabsContentProps
>(({ className, padded = false, ...props }, ref) => (
	<TabsPrimitive.Content
		ref={ref}
		className={cn(
			[
				"ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
				"data-[state=active]:animate-in data-[state=active]:fade-in-0",
			],
			padded && "p-4",
			className
		)}
		{...props}
	/>
))
TabsContent.displayName = "TabsContent"

export {
	Tabs,
	TabsList,
	TabsTrigger,
	TabsContent,
	type TabsProps,
	type TabsListProps,
	type TabsTriggerProps,
	type TabsContentProps,
}
