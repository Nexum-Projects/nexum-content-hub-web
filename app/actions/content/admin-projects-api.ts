/**
 * Rutas del recurso de proyectos (admin) relativas a {@code NEXT_PUBLIC_API_URL}
 * (por defecto termina en {@code /api}).
 *
 * Spring Boot: {@code com.contenthub_api.ContentHubApi.controller.ProjectController}
 * con {@code @RequestMapping("/api/admin/projects")}.
 *
 * - Crear: {@code POST} colección
 * - Editar: {@code PUT} {@code /api/admin/projects/{id}} → {@code ProjectController#update}
 */
export const ADMIN_PROJECTS_PATH = "/admin/projects";

export function adminProjectDetailPath(projectId: string) {
  return `${ADMIN_PROJECTS_PATH}/${encodeURIComponent(projectId)}`;
}
