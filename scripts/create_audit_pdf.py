from pathlib import Path
from fpdf import FPDF


OUTPUT = Path(r"C:\Users\Admin\Downloads\cv-platform-auditoria.pdf")


class AuditPDF(FPDF):
    def header(self):
        self.set_font("Arial", "B", 11)
        self.set_text_color(33, 37, 41)
        self.cell(0, 8, "CV Platform - Auditoria Tecnica", 0, 1, "R")
        self.set_draw_color(210, 214, 220)
        self.line(15, 18, 195, 18)
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Arial", "", 8)
        self.set_text_color(110, 110, 110)
        self.cell(0, 10, f"Pagina {self.page_no()}", 0, 0, "C")


def clean(text: str) -> str:
    replacements = {
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
        "Á": "A",
        "É": "E",
        "Í": "I",
        "Ó": "O",
        "Ú": "U",
        "ñ": "n",
        "Ñ": "N",
        "ü": "u",
        "—": "-",
        "–": "-",
        "→": "->",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


def section(pdf: FPDF, title: str):
    pdf.ln(4)
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Arial", "B", 14)
    pdf.set_text_color(20, 42, 70)
    pdf.multi_cell(pdf.epw, 8, clean(title))
    pdf.set_text_color(33, 37, 41)


def paragraph(pdf: FPDF, text: str):
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Arial", "", 10)
    pdf.multi_cell(pdf.epw, 5.5, clean(text))
    pdf.ln(1)


def bullets(pdf: FPDF, items):
    pdf.set_font("Arial", "", 10)
    for item in items:
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(pdf.epw, 5.5, clean(f"- {item}"))
    pdf.ln(1)


pdf = AuditPDF()
pdf.set_auto_page_break(auto=True, margin=18)
pdf.add_page()

pdf.set_font("Arial", "B", 20)
pdf.set_text_color(15, 23, 42)
pdf.set_x(pdf.l_margin)
pdf.multi_cell(pdf.epw, 10, "CV Platform")
pdf.set_font("Arial", "B", 15)
pdf.set_x(pdf.l_margin)
pdf.multi_cell(pdf.epw, 8, "Resumen de estado y auditoria de modificaciones pendientes")
pdf.ln(2)
pdf.set_font("Arial", "", 10)
pdf.set_text_color(80, 80, 80)
pdf.set_x(pdf.l_margin)
pdf.multi_cell(pdf.epw, 5.5, "Proyecto: cv-platform | Contexto: hardening, migracion TypeScript y estabilizacion de APIs")
pdf.ln(4)

section(pdf, "Estado actual")
paragraph(
    pdf,
    "El proyecto cv-platform esta en una fase de migracion y hardening. El frontend compila y el lint se ejecuta sin asistente interactivo, pero la funcionalidad completa aun no esta restaurada porque muchas rutas API JavaScript fueron eliminadas y solo una parte fue recreada en TypeScript.",
)
bullets(
    pdf,
    [
        "npm run build en frontend: pasa.",
        "npm run lint en frontend: pasa con warnings no bloqueantes.",
        "Ya no hay fallback secreto cvplatform_super_secure_key_2026.",
        "Ya no se usa auth_session.",
        "La sesion principal ahora va por cookie HttpOnly cv_session.",
        "El middleware valida el JWT criptograficamente en Edge.",
        "ESLint ya no abre wizard interactivo.",
    ],
)

section(pdf, "Endpoints TypeScript restaurados")
bullets(
    pdf,
    [
        "/api/auth/login",
        "/api/auth/logout",
        "/api/auth/me",
        "/api/auth/register",
        "/api/clients",
        "/api/dashboard/metrics",
        "/api/packages",
        "/api/packages/[id]",
        "/api/packages/[id]/status",
    ],
)

section(pdf, "Problema principal")
paragraph(
    pdf,
    "El build ya esta limpio de ambiguedad JS/TS, pero al borrar todos los route.js bajo frontend/app/api se eliminaron endpoints que aun no tienen reemplazo TypeScript. Las paginas pueden compilar, pero algunas funcionalidades devolveran 404 hasta migrar esas rutas.",
)

section(pdf, "Rutas pendientes de migrar")
bullets(
    pdf,
    [
        "Auth: forgot-password, reset-password, change-password.",
        "Clients: /api/clients/[id], generate-access, resend-access, profile.",
        "Client portal: /api/client/me, /api/client/packages, /api/client/packages/[id], comments y proof.",
        "Chat: contacts, messages, unread.",
        "Dashboard: monthly.",
        "Settings: /api/settings.",
        "Users: /api/users y role update.",
        "Packages: comments, pickup, proof.",
    ],
)

section(pdf, "Auditoria tecnica")
paragraph(pdf, "Prioridad 1: Restaurar funcionalidad API en TypeScript.")
bullets(
    pdf,
    [
        "Migrar endpoint por endpoint desde las versiones anteriores JS.",
        "Usar getUser(request), cookie cv_session y getDb().",
        "Aplicar roles SUPERADMIN, ADMIN, STAFF y CLIENT de forma explicita.",
        "Eliminar fallbacks JWT, ensureTables y mutaciones dinamicas de schema.",
    ],
)

paragraph(pdf, "Prioridad 2: Corregir compatibilidad UI/API.")
bullets(
    pdf,
    [
        "Dashboard llama /dashboard/monthly.",
        "Settings llama /settings.",
        "Clients llama /clients/[id], generate-access y resend-access.",
        "Chat panel llama /chat/*.",
        "Client portal llama /client/*.",
    ],
)

paragraph(pdf, "Prioridad 3: Completar modelo de autenticacion.")
bullets(
    pdf,
    [
        "Login setea cookie HttpOnly.",
        "Layouts deben consultar /api/auth/me.",
        "Eliminar dependencia de localStorage.user.",
        "Logout debe limpiar cookie y estado local.",
        "Middleware decide acceso por rol.",
    ],
)

paragraph(pdf, "Prioridad 4: Base de datos y tenant isolation.")
bullets(
    pdf,
    [
        "Revisar filtros por tenant/owner donde aplique.",
        "Definir si STAFF/ADMIN ven todo o solo tenant.",
        "Evitar queries globales sin contexto.",
        "Revisar FK y tipos UUID en todas las rutas.",
    ],
)

paragraph(pdf, "Prioridad 5: Dependencias y seguridad.")
bullets(
    pdf,
    [
        "Frontend: 19 vulnerabilidades, 11 high.",
        "Backend: 13 vulnerabilidades, 5 high.",
        "Atender especialmente next, xlsx, express, resend transitivo, twilio y bcrypt/bcryptjs.",
    ],
)

paragraph(pdf, "Prioridad 6: Tests reales.")
bullets(
    pdf,
    [
        "Login, logout y sesion.",
        "Permisos por rol.",
        "CRUD clientes y paquetes.",
        "Transiciones de estado.",
        "Aislamiento del portal cliente.",
        "Metricas del dashboard.",
    ],
)

section(pdf, "Conclusion")
paragraph(
    pdf,
    "El proyecto esta en mejor estado para compilar y desplegar que antes, pero esta incompleto funcionalmente. La siguiente fase debe ser una migracion ordenada de las rutas API eliminadas a TypeScript, manteniendo el modelo seguro de sesion cv_session.",
)
bullets(
    pdf,
    [
        "Restaurar /api/settings.",
        "Restaurar /api/dashboard/monthly.",
        "Restaurar /api/clients/[id].",
        "Restaurar generate-access y resend-access.",
        "Restaurar /api/chat/*.",
        "Restaurar /api/client/*.",
        "Restaurar package proof/comments/pickup.",
        "Restaurar password reset/change-password.",
    ],
)

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
pdf.output(str(OUTPUT))
print(str(OUTPUT))
