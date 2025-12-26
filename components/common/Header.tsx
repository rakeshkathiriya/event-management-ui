import Link from "next/link";

const Header = () => {
  return (
    <header className="bg-bgPrimary h-16 flex items-center">
      <div className="mx-auto w-full max-w-7xl px-6 flex items-center justify-between">
        {/* Logo */}
        <h1 className="text-white text-xl font-semibold">Event</h1>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {/* <Link href="/" className="text-white text-md hover:opacity-80">
            Home
          </Link> */}
          <Link href="/main/programs" className="text-white text-md hover:opacity-80">
            Events
          </Link>
          <Link href="/main/department" className="text-white text-md hover:opacity-80">
            Department
          </Link>
          <Link href="/main/user" className="text-white text-md hover:opacity-80">
            User
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
