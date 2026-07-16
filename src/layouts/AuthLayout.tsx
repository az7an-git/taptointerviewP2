import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center items-center py-12 px-6 sm:px-10 lg:px-16 relative overflow-hidden">
      <div className="absolute top-1/4 -left-10 w-72 h-72 bg-orange-600/20 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-1/4 -right-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl opacity-50"></div>

      <div className="w-full max-w-5xl lg:max-w-6xl 2xl:max-w-7xl flex flex-col md:flex-row items-center justify-between gap-12 md:gap-20 2xl:gap-32 relative z-10">
        <div className="text-center md:text-left flex-1 space-y-4 lg:space-y-6">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <span className="w-8 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></span>
            <span className="text-xs lg:text-sm uppercase tracking-widest text-orange-500 font-bold">Smart Queue</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl 2xl:text-8xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
            Tap To <br className="hidden md:block" /> Interview
          </h1>

          <p className="text-gray-400 text-sm md:text-base lg:text-lg max-w-xs md:max-w-sm mx-auto md:mx-0 font-medium">
            Seamless real-time queue management for high-volume interviews.
          </p>
        </div>

        <div className="flex-1 flex justify-center md:justify-end w-full min-w-0 max-w-sm md:max-w-md">
          <Outlet />
        </div>

      </div>
    </div>
  );
}
