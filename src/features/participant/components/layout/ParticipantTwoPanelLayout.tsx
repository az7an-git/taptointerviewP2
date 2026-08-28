import React from "react";
import { ParticipantFooter } from "./ParticipantFooter";
import { ParticipantHeader } from "./ParticipantHeader";

export interface ParticipantTwoPanelLayoutProps {
    companyName: string;
    leftPanel: React.ReactNode;
    rightPanel: React.ReactNode;
    containerClassName?: string;
}

export function ParticipantTwoPanelLayout({
    companyName,
    leftPanel,
    rightPanel,
    containerClassName = "my-auto",
}: ParticipantTwoPanelLayoutProps) {
    return (
        <div className="fixed inset-0 bg-[#0B0F19] text-white font-sans flex flex-col antialiased overflow-y-auto overflow-x-hidden">
            {/* Ambient Glow background */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF512F] opacity-5 blur-3xl rounded-full pointer-events-none" />

            <ParticipantHeader companyName={companyName} />

            {/* Main Content Area */}
            <div className="flex-1 p-4 relative z-10 w-full flex flex-col items-center justify-start py-6">
                <div
                    className={`w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-5 ${containerClassName}`}
                >
                    {/* Left Side: Information / Intro (2/5 columns) */}
                    <div className="md:col-span-2 bg-gradient-to-br from-black/80 to-black/40 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF512F] opacity-10 blur-2xl rounded-full pointer-events-none" />
                        {leftPanel}
                    </div>

                    {/* Right Side: Form / Content (3/5 columns) */}
                    <div className="md:col-span-3 p-6 flex flex-col justify-center">
                        {rightPanel}
                    </div>
                </div>
            </div>

            <ParticipantFooter />
        </div>
    );
}
