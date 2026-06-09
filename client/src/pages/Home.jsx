import React from "react";
import { Link } from "react-router-dom";
import {
    FileText,
    Cpu,
    CircleCheck
} from "lucide-react";
export default function Home() {
    const workflowSteps = [
        {
            number: "01",
            title: "Report",
            icon: FileText,
            desc: "Submit issues instantly with screenshots and AI summaries.",
        },
        {
            number: "02",
            title: "Analyze",
            icon: Cpu,
            desc: "AI prioritizes bugs, detects duplicates and suggests fixes.",
        },
        {
            number: "03",
            title: "Resolve",
            icon: CircleCheck,
            desc: "Track progress and close issues faster with your team.",
        },
    ];

    const features = [
        {
            title: "AI Bug Detection",
            desc: "Automatically detect bugs and receive intelligent fix suggestions.",
        },
        {
            title: "Real-Time Collaboration",
            desc: "Work together with developers, testers and managers seamlessly.",
        },
        {
            title: "Analytics Dashboard",
            desc: "Gain insights into bug trends, team performance and resolution times.",
        },
        {
            title: "Custom Workflows",
            desc: "Create workflows that match your development process.",
        },
        {
            title: "Smart Notifications",
            desc: "Stay updated with instant alerts on critical issues.",
        },
        {
            title: "Role-Based Access",
            desc: "Control permissions and visibility for every team member.",
        },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
            {/* Grid Background */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage:
                        "linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                    opacity: 0.3,
                }}
            />

            {/* Red Glow Effects */}
            <div className="absolute w-[500px] h-[500px] rounded-full bg-red-600 opacity-[0.06] -top-48 left-1/2 -translate-x-1/2" />
            <div className="absolute w-[300px] h-[300px] rounded-full bg-red-600 opacity-[0.04] top-1/3 -left-24" />
            <div className="absolute w-[250px] h-[250px] rounded-full bg-red-600 opacity-[0.04] bottom-20 -right-16" />

            {/* Scan Lines */}
            <div className="absolute h-px w-48 bg-red-600 opacity-15 top-1/4 left-0" />
            <div className="absolute h-px w-28 bg-red-600 opacity-15 bottom-1/3 right-0" />
            <div className="absolute w-px h-36 bg-red-600 opacity-15 top-0 left-1/4" />
            <div className="absolute w-px h-24 bg-red-600 opacity-15 bottom-0 right-1/3" />

            {/* Floating Dots */}
            {[
                { top: "22%", left: "24%" },
                { top: "70%", left: "18%" },
                { top: "35%", right: "22%" },
                { bottom: "25%", right: "28%" },
                { top: "15%", right: "35%" },
            ].map((pos, i) => (
                <div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-red-500 opacity-50"
                    style={pos}
                />
            ))}

            {/* Navbar */}
            <nav className="relative z-20 border-b border-[#151515] backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="text-3xl font-bold tracking-tight">
                        Debug<span className="text-red-500">X</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
                        <a href="#features" className="hover:text-white transition">
                            Features
                        </a>

                        <a href="#how-it-works" className="hover:text-white transition">
                            How It Works
                        </a>

                        <Link to="/login" className="hover:text-white transition">
                            Login
                        </Link>

                        <Link
                            to="/register"
                            className="bg-red-600 hover:bg-red-500 px-5 py-2.5 rounded-xl text-white font-medium transition"
                        >
                            Start Free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32">
                <div className="max-w-4xl">
                    <div className="inline-flex items-center gap-2 border border-red-500/20 bg-red-500/10 px-4 py-2 rounded-full text-red-400 text-xs tracking-wider mb-8">
                        AI POWERED BUG MANAGEMENT
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
                        Where Bugs Meet Their{" "}
                        <span className="text-red-500">End.</span>
                    </h1>

                    <p className="mt-8 text-xl text-zinc-400 max-w-2xl leading-relaxed">
                        Report, track, prioritize and resolve software issues with
                        intelligent AI assistance built for modern development teams.
                    </p>

                    <div className="flex flex-wrap gap-4 mt-10">
                        <Link
                            to="/register"
                            className="bg-red-600 hover:bg-red-500 px-8 py-4 rounded-xl font-semibold transition"
                        >
                            Get Started →
                        </Link>

                        <Link
                            to="/login"
                            className="border border-[#222] hover:border-red-600/50 px-8 py-4 rounded-xl text-zinc-300 transition"
                        >
                            Sign In
                        </Link>
                    </div>

                    <div className="mt-12 flex flex-wrap gap-8 text-sm text-zinc-500">
                        <span>✓ AI Assisted</span>
                        <span>✓ Team Collaboration</span>
                        <span>✓ Analytics Dashboard</span>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section
                id="features"
                className="relative z-10 max-w-7xl mx-auto px-6 pb-28"
            >
                <div className="mb-12">
                    <span className="text-red-500 text-sm tracking-widest uppercase">
                        Features
                    </span>

                    <h2 className="text-4xl md:text-5xl font-bold mt-3">
                        Everything you need to manage bugs.
                    </h2>

                    <p className="text-zinc-500 mt-4 max-w-2xl">
                        Built for developers, testers, project managers, and growing teams.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <div
                            key={i}
                            className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 hover:border-red-600/40 transition-all duration-300"
                        >
                            <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-500 mb-5">
                                ✦
                            </div>

                            <h3 className="text-xl font-semibold mb-3">
                                {feature.title}
                            </h3>

                            <p className="text-zinc-500 text-sm leading-relaxed">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it Works */}
            {/* How it Works */}
            <section
                id="how-it-works"
                className="relative z-10 max-w-7xl mx-auto px-6 py-32"
            >
                <div className="text-center mb-20">
                    <span className="text-red-500 text-sm tracking-[0.3em] uppercase">
                        Workflow
                    </span>

                    <h2 className="text-5xl md:text-6xl font-bold mt-4">
                        From Bug to Fix.
                    </h2>

                    <p className="text-zinc-500 mt-5 max-w-2xl mx-auto">
                        DebugX automates the entire lifecycle of issue management.
                    </p>
                </div>

                <div className="relative flex flex-col lg:flex-row items-center justify-between gap-20">

                    {/* Connecting Line */}
                    <div className="hidden lg:block absolute top-1/2 left-[12%] right-[12%] -translate-y-1/2 z-0">
                        <div className="h-[3px] w-full bg-gradient-to-r from-red-700 via-red-500 to-red-700" />

                        {/* Connector Dots */}
                        <div className="absolute left-1/3 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.9)]" />

                        <div className="absolute left-2/3 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.9)]" />
                    </div>

                    {workflowSteps.map((item) => {
                        const Icon = item.icon;

                        return (
                            <div
                                key={item.number}
                                className="
                        relative z-10
                        w-full max-w-[360px]
                        bg-[#0a0a0a]
                        border border-[#222]
                        rounded-3xl
                        p-8
                        transition-all duration-300
                        hover:border-red-600/40
                    "
                            >
                                {/* Icon */}
                                <div className="w-16 h-16 rounded-2xl bg-[#0d0d0d] border border-red-600/20 flex items-center justify-center mb-6">
                                    <Icon size={28} className="text-red-500" />
                                </div>

                                <h3 className="text-3xl font-bold mb-4 text-white">
                                    {item.title}
                                </h3>

                                <p className="text-zinc-500 leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* CTA */}
            < section className="relative z-10 max-w-6xl mx-auto px-6 pb-32" >
                <div className="relative overflow-hidden rounded-[32px] border border-[#222] bg-[#0a0a0a]">

                    <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 blur-[120px]" />

                    <div className="relative p-12 md:p-20">

                        <div className="text-center">
                            <span className="text-red-500 tracking-[0.3em] text-sm uppercase">
                                Ready To Start?
                            </span>

                            <h2 className="text-5xl md:text-6xl font-bold mt-5">
                                Ship Better Software.
                            </h2>

                            <p className="text-zinc-500 mt-6 max-w-2xl mx-auto">
                                Track issues, automate workflows and eliminate bugs faster.
                            </p>
                        </div>

                        <div className="mt-14 grid md:grid-cols-3 gap-6">

                            <div className="bg-black/50 border border-[#222] rounded-2xl p-6">
                                <div className="text-red-500 text-3xl font-bold">92%</div>
                                <div className="text-zinc-500 mt-2">
                                    Faster Resolution
                                </div>
                            </div>

                            <div className="bg-black/50 border border-[#222] rounded-2xl p-6">
                                <div className="text-red-500 text-3xl font-bold">24/7</div>
                                <div className="text-zinc-500 mt-2">
                                    AI Assistance
                                </div>
                            </div>

                            <div className="bg-black/50 border border-[#222] rounded-2xl p-6">
                                <div className="text-red-500 text-3xl font-bold">10K+</div>
                                <div className="text-zinc-500 mt-2">
                                    Bugs Resolved
                                </div>
                            </div>

                        </div>

                        <div className="flex justify-center mt-12">
                            <Link
                                to="/register"
                                className="bg-red-600 hover:bg-red-500 px-8 py-4 rounded-xl font-semibold transition"
                            >
                                Start Free Today →
                            </Link>
                        </div>

                    </div>
                </div>
            </section >

            {/* Footer */}
            < footer className="relative z-10 border-t border-[#151515] py-8 text-center text-zinc-600 text-sm" >
                © 2026 DebugX.Built for developers.
            </footer >
        </div >
    );
}