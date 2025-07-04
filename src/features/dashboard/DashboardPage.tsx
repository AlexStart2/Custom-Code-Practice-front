import type { JSX } from "react";

export default function DashboardPage(): JSX.Element {
    return (
        <div className="text-center mt-20">
            <h1 className="text-3xl font-bold">Welcome to Trainify Dashboard</h1>
            <p className="mt-4">Here you'll see your training jobs and models.</p>
        </div>
    );
}