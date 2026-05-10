"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Home,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Settings,
  Shield,
  Sun,
  Trophy,
  User,
  Users,
  Utensils,
} from "lucide-react";

import { logout } from "@/app/actions/auth";
import { getProjectSummary, getProjects } from "@/app/actions/content";
import type { Project, ProjectSummary } from "@/app/actions/content";
import type { SessionClaims } from "@/utils/auth-token";
import { humanizePlatformRole } from "@/utils/helpers/humanize-enum";
import { cn, resolveAvatarUrl } from "@/lib/utils";
import { NexumLogo } from "./nexum-logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

function isAdminRole(role?: unknown) {
  return role === "SUPER_ADMIN" || role === "SYSADMIN";
}

function getProjectId(pathname: string) {
  const match = pathname.match(/^\/dashboard\/projects\/([^/]+)/);
  const id = match?.[1] ?? null;
  return id === "new" ? null : id;
}

function subscribeTheme(callback: () => void) {
  window.addEventListener("nexum-theme-change", callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener("nexum-theme-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getThemeSnapshot() {
  return document.documentElement.classList.contains("dark");
}

type NavItem = { label: string; href: string; icon: LucideIcon };

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavSection({
  title,
  items,
  pathname,
  onItemClick,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  onItemClick?: () => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-0.5">
      <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground first:pt-0">{title}</p>
      {items.map((item) => {
        const Icon = item.icon;
        const active = isNavActive(pathname, item.href);

        return (
          <Link
            className={cn(
              "flex h-10 items-center gap-3 rounded-lg border-l-2 px-3 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary/10 text-primary dark:bg-primary/15"
                : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            href={item.href}
            key={item.href}
            onClick={onItemClick}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-90" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

type DashboardSidebarContentProps = {
  topPaddingForClose?: boolean;
  pathname: string;
  projectId: string | null;
  activeProjectSummary: ProjectSummary | null;
  projectPickerOpen: boolean;
  setProjectPickerOpen: (open: boolean) => void;
  openProjectPicker: () => void;
  projectsList: Project[] | null;
  closeNav: () => void;
  generalItems: NavItem[];
  contenidoItems: NavItem[];
  adminItems: NavItem[];
  userName: string;
  userEmail: string;
  userInitial: string;
  userAvatarUrl: string | null;
  roleLine: string;
  userMenuOpen: boolean;
  setUserMenuOpen: Dispatch<SetStateAction<boolean>>;
  isAdmin: boolean;
  onLogout: () => void | Promise<void>;
};

function DashboardSidebarContent({
  topPaddingForClose,
  pathname,
  projectId,
  activeProjectSummary,
  projectPickerOpen,
  setProjectPickerOpen,
  openProjectPicker,
  projectsList,
  closeNav,
  generalItems,
  contenidoItems,
  adminItems,
  userName,
  userEmail,
  userInitial,
  userAvatarUrl,
  roleLine,
  userMenuOpen,
  setUserMenuOpen,
  isAdmin,
  onLogout,
}: DashboardSidebarContentProps) {
  const projectAvatarSrc = activeProjectSummary ? resolveAvatarUrl(activeProjectSummary) : null;
  const projectInitial = (activeProjectSummary?.name ?? "P").slice(0, 1).toUpperCase();
  const projectLabelText = activeProjectSummary?.name ?? (projectId ? "Cargando…" : "Seleccionar proyecto");

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-card">
      <header className={cn("shrink-0 border-b border-border px-3 pb-3", topPaddingForClose ? "pt-10" : "pt-3")}>
        <NexumLogo size="sm" />
        <Separator className="mt-3" />
      </header>

      <div className="relative shrink-0 border-b border-border px-2 py-2">
        <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Proyecto actual</p>
        <button
          aria-expanded={projectPickerOpen}
          className="flex h-11 w-full items-center gap-2.5 rounded-lg border border-border bg-background px-2.5 text-left text-sm transition-colors hover:bg-muted/80"
          onClick={openProjectPicker}
          type="button"
        >
          <div className="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-md bg-primary/15 text-xs font-semibold text-primary">
            {projectAvatarSrc ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className="absolute inset-0 h-full w-full object-cover" src={projectAvatarSrc} />
              </>
            ) : (
              projectInitial
            )}
          </div>
          <span className="min-w-0 flex-1 truncate font-medium text-foreground">{projectLabelText}</span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", projectPickerOpen && "rotate-180")} />
        </button>

        {projectPickerOpen && (
          <>
            <button
              aria-label="Cerrar selector de proyecto"
              className="fixed inset-0 z-30"
              onClick={() => setProjectPickerOpen(false)}
              type="button"
            />
            <div className="absolute left-2 right-2 top-full z-40 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-md">
              <Link
                className="flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                href="/dashboard"
                onClick={() => {
                  setProjectPickerOpen(false);
                  closeNav();
                }}
              >
                Todos los proyectos
              </Link>
              {projectsList?.map((p) => (
                <Link
                  className={cn(
                    "flex h-9 items-center rounded-md px-3 text-sm hover:bg-muted",
                    p.id === projectId ? "bg-primary/10 font-medium text-primary" : "text-foreground",
                  )}
                  href={`/dashboard/projects/${p.id}`}
                  key={p.id}
                  onClick={() => {
                    setProjectPickerOpen(false);
                    closeNav();
                  }}
                >
                  <span className="truncate">{p.name}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-2">
        <NavSection items={generalItems} onItemClick={closeNav} pathname={pathname} title="General" />
        <NavSection items={contenidoItems} onItemClick={closeNav} pathname={pathname} title="Contenido" />
        <NavSection items={adminItems} onItemClick={closeNav} pathname={pathname} title="Administración" />
      </nav>

      <footer className="relative mt-auto shrink-0 border-t border-border p-2">
        <button
          aria-expanded={userMenuOpen}
          className="flex h-11 w-full items-center gap-2.5 rounded-lg px-2 text-left text-sm transition-colors hover:bg-muted"
          onClick={() => setUserMenuOpen((v) => !v)}
          type="button"
        >
          <div className="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {userAvatarUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- URL remota del CMS / JWT */}
                <img alt={`Avatar de ${userName}`} className="absolute inset-0 h-full w-full object-cover" src={userAvatarUrl} />
              </>
            ) : (
              userInitial
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-foreground">{userName}</p>
            <p className="truncate text-xs text-muted-foreground">{roleLine}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>

        {userMenuOpen && (
          <>
            <button aria-label="Cerrar menu de cuenta" className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} type="button" />
            <div className="absolute bottom-full left-2 right-2 z-40 mb-1 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg">
              <div className="flex items-start gap-2 px-2 py-2">
                <div className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {userAvatarUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt="" className="absolute inset-0 h-full w-full object-cover" src={userAvatarUrl} />
                    </>
                  ) : (
                    userInitial
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{userName}</p>
                  <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                  {isAdmin && (
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      <Shield className="h-3 w-3" />
                      SUPER_ADMIN
                    </div>
                  )}
                </div>
              </div>
              <Separator className="my-1" />
              <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted" type="button">
                <User className="h-4 w-4" />
                Perfil
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-destructive hover:bg-destructive/10"
                onClick={onLogout}
                type="button"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </footer>
    </div>
  );
}

export function DashboardShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: SessionClaims | null;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [projectsList, setProjectsList] = useState<Project[] | null>(null);
  const [currentProject, setCurrentProject] = useState<ProjectSummary | null>(null);

  const dark = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => false);

  useLayoutEffect(() => {
    const stored = localStorage.getItem("theme");
    const resolved = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", resolved);
    window.dispatchEvent(new Event("nexum-theme-change"));
  }, []);

  const pathname = usePathname();
  const router = useRouter();
  const userName = session?.name ?? "Usuario";
  const userEmail = session?.email ?? "Sin correo";
  const userAvatarUrl = resolveAvatarUrl(session);
  const userInitial = String(userName).slice(0, 1).toUpperCase();
  const isAdmin = isAdminRole(session?.platformRole);
  const projectId = getProjectId(pathname);

  const roleLine = isAdmin ? humanizePlatformRole(session?.platformRole) : userEmail;

  const generalItems = useMemo((): NavItem[] => {
    const list: NavItem[] = [{ label: "Proyectos", href: "/dashboard", icon: Home }];
    if (projectId) {
      list.push({ label: "Dashboard", href: `/dashboard/projects/${projectId}`, icon: LayoutDashboard });
    }

    return list;
  }, [projectId]);

  const contenidoItems = useMemo((): NavItem[] => {
    if (!projectId) {
      return [];
    }

    const base = `/dashboard/projects/${projectId}`;

    return [
      { label: "Banners", href: `${base}/banners`, icon: ImageIcon },
      { label: "Menú / Productos", href: `${base}/products`, icon: Utensils },
      { label: "Eventos", href: `${base}/events`, icon: FolderKanban },
      { label: "Logros / Premios", href: `${base}/awards`, icon: Trophy },
      { label: "Medios", href: `${base}/media`, icon: Package },
    ];
  }, [projectId]);

  const adminItems = useMemo((): NavItem[] => {
    const list: NavItem[] = [];
    if (projectId) {
      list.push({ label: "Configuración", href: `/dashboard/projects/${projectId}/settings`, icon: Settings });
    }

    if (isAdmin) {
      list.push({ label: "Usuarios", href: "/dashboard/admin/users", icon: Users });
    }

    return list;
  }, [projectId, isAdmin]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    let cancelled = false;
    void getProjectSummary(projectId).then((result) => {
      if (cancelled || result.status !== "success") {
        return;
      }

      setCurrentProject(result.data);
    });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const loadProjectsList = useCallback(async () => {
    if (projectsList) {
      return;
    }

    const result = await getProjects();
    if (result.status === "success") {
      setProjectsList(result.data);
    }
  }, [projectsList]);

  const openProjectPicker = () => {
    setProjectPickerOpen((open) => !open);
    void loadProjectsList();
  };

  useEffect(() => {
    if (!projectPickerOpen) {
      return;
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProjectPickerOpen(false);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [projectPickerOpen]);

  const closeNav = () => setSheetOpen(false);

  const activeProjectSummary = projectId && currentProject?.id === projectId ? currentProject : null;

  function toggleTheme() {
    const next = !dark;
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
    window.dispatchEvent(new Event("nexum-theme-change"));
  }

  async function onLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  const sidebarProps: DashboardSidebarContentProps = {
    pathname,
    projectId,
    activeProjectSummary,
    projectPickerOpen,
    setProjectPickerOpen,
    openProjectPicker,
    projectsList,
    closeNav,
    generalItems,
    contenidoItems,
    adminItems,
    userName,
    userEmail,
    userInitial,
    userAvatarUrl,
    roleLine,
    userMenuOpen,
    setUserMenuOpen,
    isAdmin,
    onLogout,
  };

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="sticky top-0 z-30 hidden h-dvh w-72 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <DashboardSidebarContent {...sidebarProps} />
      </aside>

      <div className="lg:hidden">
        <Sheet onOpenChange={setSheetOpen} open={sheetOpen}>
          <SheetContent className="w-72 max-w-[min(100vw-1rem,18rem)] border-r border-border p-0" side="left">
            <SheetTitle className="sr-only">Menu de navegacion</SheetTitle>
            <DashboardSidebarContent {...sidebarProps} topPaddingForClose />
          </SheetContent>
        </Sheet>
      </div>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-3 backdrop-blur supports-backdrop-filter:bg-background/75 md:px-4">
          <Button className="lg:hidden" onClick={() => setSheetOpen(true)} size="icon" variant="ghost">
            <Menu className="h-5 w-5" />
          </Button>

          <div className="ml-auto flex items-center gap-1">
            <Button onClick={toggleTheme} size="icon" variant="ghost">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>
        <main className="px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
