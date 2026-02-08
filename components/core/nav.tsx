/**
 * NAV COMPONENT
 * ----------------------------------------------------------------------------
 * This component renders the top-level responsive navigation bar for the application.
 * It automatically adapts between desktop and mobile layouts:
 * - Desktop: Displays a horizontal list of links and an authentication button.
 * - Mobile: Collapses links into a slide-out drawer (Sheet) accessible via a hamburger menu.
 * It serves as the main entry point for global navigation, linking to key areas like Home, Client, Server, and Profile.
 */

import Link from "next/link";

import { Menu, Swords } from '@/lib/icon-utils';

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import AuthButton from "@/components/auth/auth-buttons";

interface MenuItem {
  title: string;
  url: string;
}

const NAV_MENU_ITEMS: MenuItem[] = [
  { title: "Home", url: "/" },
  {
    title: "Characters",
    url: "/",
  },
  {
    title: "Settings",
    url: "/settings",
  },
];

export default function Nav() {
  return (
    <section className="p-4 border-b">
      <div className="container mx-auto">
        {/* Desktop Menu */}
        <nav className="hidden justify-between lg:flex">
          <div className="flex items-center gap-6">
            <Logo />
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {NAV_MENU_ITEMS.map((item) => renderMenuItem(item))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>

          <AuthButton />
        </nav>

        {/* Mobile Menu */}
        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            <Logo />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <Logo />
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 p-4">
                  {NAV_MENU_ITEMS.map((item) => renderMobileMenuItem(item))}

                  <AuthButton />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
}

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Swords className="size-5 text-dagger-gold" />
      <span className="text-lg font-serif font-semibold tracking-tight text-white">Daggerheart</span>
    </Link>
  );
};

const renderMenuItem = (item: MenuItem) => {
  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink
        href={item.url}
        className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-accent-foreground"
      >
        {item.title}
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

const renderMobileMenuItem = (item: MenuItem) => {
  return (
    <Link key={item.title} href={item.url} className="text-md font-semibold">
      {item.title}
    </Link>
  );
};
