import * as React from 'react'
import type { MouseEvent, ReactElement } from 'react'

type Ctx = { onOpenChange?: (open: boolean) => void }
const DrawerContext = React.createContext<Ctx | null>(null)

export function Drawer({ children, open, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
	return <DrawerContext.Provider value={{ onOpenChange }}><div aria-hidden={open === false}>{children}</div></DrawerContext.Provider>
}
export function DrawerTrigger({ children }: { children: React.ReactNode }) { return <>{children}</> }
export function DrawerContent({ children }: { children: React.ReactNode }) { return <div className="fixed inset-0 bg-black/30"><div className="absolute right-0 top-0 h-full w-full max-w-xl bg-background shadow-xl">{children}</div></div> }
export function DrawerHeader({ children }: { children: React.ReactNode }) { return <div className="p-4 border-b">{children}</div> }
export function DrawerTitle({ children }: { children: React.ReactNode }) { return <h2 className="text-lg font-semibold">{children}</h2> }
export function DrawerDescription({ children }: { children: React.ReactNode }) { return <p className="text-sm text-muted-foreground">{children}</p> }
export function DrawerFooter({ children }: { children: React.ReactNode }) { return <div className="p-4 border-t">{children}</div> }
type ClickableProps = { onClick?: (e: MouseEvent<unknown>) => void }
export function DrawerClose({ asChild, children, ...props }: { asChild?: boolean; children: ReactElement<ClickableProps> } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
	const ctx = React.useContext(DrawerContext)
	if (asChild && React.isValidElement(children)) {
		const originalOnClick = children.props?.onClick as ((e: MouseEvent<unknown>) => void) | undefined
		return React.cloneElement(children as ReactElement<ClickableProps>, {
			onClick: (e: MouseEvent<unknown>) => {
				originalOnClick?.(e)
				ctx?.onOpenChange?.(false)
			},
		})
	}
	return <button onClick={() => ctx?.onOpenChange?.(false)} {...props}>{children}</button>
}
