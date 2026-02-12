"use client";
import { cn } from "@/lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
    motion,
    AnimatePresence,
    useScroll,
    useMotionValueEvent,
} from "motion/react";

import React, { useRef, useState } from "react";

interface NavbarProps {
    children: React.ReactNode;
    className?: string;
}

interface NavBodyProps {
    children: React.ReactNode;
    className?: string;
    visible?: boolean;
}

interface MobileNavProps {
    children: React.ReactNode;
    className?: string;
    visible?: boolean;
}

interface MobileNavHeaderProps {
    children: React.ReactNode;
    className?: string;
}

interface MobileNavMenuProps {
    children: React.ReactNode;
    className?: string;
    isOpen: boolean;
    onClose: () => void;
}

export const Navbar = ({ children, className }: NavbarProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const [visible, setVisible] = useState<boolean>(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        setVisible(latest > 50);
    });

    return (
        <div
            ref={ref}
            className={cn("sticky top-0 z-40 w-full", className)}
        >
            {React.Children.map(children, (child) =>
                React.isValidElement(child)
                    ? React.cloneElement(
                        child as React.ReactElement<{ visible?: boolean }>,
                        { visible },
                    )
                    : child,
            )}
        </div>
    );
};

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
    return (
        <motion.div
            animate={{
                backdropFilter: visible ? "blur(16px)" : "blur(12px)",
                borderBottomColor: visible
                    ? "rgba(99, 102, 241, 0.15)"
                    : "rgba(51, 65, 85, 0.3)",
            }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 40,
            }}
            className={cn(
                "relative z-[60] hidden w-full flex-row items-center justify-between lg:flex",
                "h-16 px-6 border-b bg-slate-950/80",
                className,
            )}
        >
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
                {children}
            </div>
        </motion.div>
    );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
    return (
        <div
            className={cn(
                "relative z-50 flex w-full flex-col items-center justify-between lg:hidden",
                "h-16 px-4 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl",
                className,
            )}
        >
            {children}
        </div>
    );
};

export const MobileNavHeader = ({
    children,
    className,
}: MobileNavHeaderProps) => {
    return (
        <div
            className={cn(
                "flex h-full w-full flex-row items-center justify-between",
                className,
            )}
        >
            {children}
        </div>
    );
};

export const MobileNavMenu = ({
    children,
    className,
    isOpen,
    onClose,
}: MobileNavMenuProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    />
                    {/* Menu */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={cn(
                            "absolute inset-x-0 top-full z-50 mx-3 mt-2 flex flex-col gap-4 rounded-2xl border border-slate-700/50 bg-slate-900 px-5 py-5 shadow-2xl shadow-black/40",
                            className,
                        )}
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export const MobileNavToggle = ({
    isOpen,
    onClick,
}: {
    isOpen: boolean;
    onClick: () => void;
}) => {
    return (
        <button
            onClick={onClick}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/80 text-slate-300 transition-all hover:text-white"
        >
            {isOpen ? (
                <IconX className="h-5 w-5" />
            ) : (
                <IconMenu2 className="h-5 w-5" />
            )}
        </button>
    );
};
