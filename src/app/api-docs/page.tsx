import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "API Docs | Edu Platform",
  description: "Список API endpoints образовательной платформы",
};

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";
type Access = "Public" | "Student" | "Curator" | "Admin" | "Admin/Curator";

interface ApiEndpoint {
  group: string;
  method: HttpMethod;
  path: string;
  access: Access;
  description: string;
}

const endpoints: ApiEndpoint[] = [
  {
    group: "Auth",
    method: "POST",
    path: "/api/auth/login",
    access: "Public",
    description: "Авторизация пользователя через Supabase Auth.",
  },
  {
    group: "Auth",
    method: "POST",
    path: "/api/auth/logout",
    access: "Student",
    description: "Выход из аккаунта и очистка сессии.",
  },
  {
    group: "User",
    method: "GET",
    path: "/api/me",
    access: "Student",
    description: "Получение данных текущего пользователя.",
  },
  {
    group: "User",
    method: "PATCH",
    path: "/api/profile",
    access: "Student",
    description: "Обновление профиля пользователя.",
  },
  {
    group: "Progress",
    method: "GET",
    path: "/api/progress",
    access: "Student",
    description: "Получение прогресса текущего обучающегося.",
  },
  {
    group: "Progress",
    method: "DELETE",
    path: "/api/progress",
    access: "Student",
    description: "Сброс локального прогресса пользователя.",
  },
  {
    group: "Progress",
    method: "POST",
    path: "/api/progress/lesson",
    access: "Student",
    description: "Сохранение прогресса по уроку: видео, теория, практика и баллы.",
  },
  {
    group: "Progress",
    method: "GET",
    path: "/api/progress/dynamic-step",
    access: "Student",
    description: "Получение списка выполненных динамических шагов урока.",
  },
  {
    group: "Progress",
    method: "POST",
    path: "/api/progress/dynamic-step",
    access: "Student",
    description: "Отметка динамического шага как выполненного и начисление XP.",
  },
  {
    group: "XP",
    method: "POST",
    path: "/api/xp/award",
    access: "Student",
    description: "Начисление XP за учебное действие.",
  },
  {
    group: "Leaderboard",
    method: "GET",
    path: "/api/leaderboard",
    access: "Student",
    description: "Получение рейтинга обучающихся по XP.",
  },
  {
    group: "Shop",
    method: "POST",
    path: "/api/shop/buy",
    access: "Student",
    description: "Покупка элемента профиля во внутреннем магазине.",
  },
  {
    group: "Notifications",
    method: "GET",
    path: "/api/notifications",
    access: "Student",
    description: "Получение уведомлений пользователя.",
  },
  {
    group: "Notifications",
    method: "PATCH",
    path: "/api/notifications",
    access: "Student",
    description: "Отметка уведомлений как прочитанных.",
  },
  {
    group: "Submissions",
    method: "GET",
    path: "/api/submissions",
    access: "Student",
    description: "Получение списка отправленных работ.",
  },
  {
    group: "Submissions",
    method: "POST",
    path: "/api/submissions",
    access: "Student",
    description: "Отправка домашней работы на проверку.",
  },
  {
    group: "Submissions",
    method: "GET",
    path: "/api/submissions/my",
    access: "Student",
    description: "Получение работ текущего обучающегося.",
  },
  {
    group: "Submissions",
    method: "POST",
    path: "/api/submissions/upload-url",
    access: "Student",
    description: "Создание ссылки для загрузки файла домашней работы.",
  },
  {
    group: "Admin",
    method: "GET",
    path: "/api/admin/students",
    access: "Admin/Curator",
    description: "Получение списка обучающихся с пагинацией и поиском.",
  },
  {
    group: "Admin",
    method: "GET",
    path: "/api/admin/students/[id]",
    access: "Admin/Curator",
    description: "Получение данных конкретного обучающегося.",
  },
  {
    group: "Admin",
    method: "GET",
    path: "/api/admin/students/export",
    access: "Admin/Curator",
    description: "Экспорт списка обучающихся в CSV.",
  },
  {
    group: "Admin",
    method: "PATCH",
    path: "/api/admin/students/[id]/xp",
    access: "Admin",
    description: "Ручное изменение XP обучающегося.",
  },
  {
    group: "Admin",
    method: "POST",
    path: "/api/admin/students/[id]/unlock",
    access: "Admin",
    description: "Открытие конкретного урока для обучающегося.",
  },
  {
    group: "Admin",
    method: "POST",
    path: "/api/admin/students/[id]/unlock-up-to",
    access: "Admin",
    description: "Открытие уроков обучающегося до выбранного уровня.",
  },
  {
    group: "Admin",
    method: "GET",
    path: "/api/admin/submissions",
    access: "Admin/Curator",
    description: "Получение работ обучающихся для проверки.",
  },
  {
    group: "Admin",
    method: "PATCH",
    path: "/api/admin/submissions/[id]",
    access: "Admin/Curator",
    description: "Проверка работы: принятие или отправка на доработку.",
  },
  {
    group: "Curator",
    method: "GET",
    path: "/api/curator/groups",
    access: "Admin/Curator",
    description: "Получение групп преподавателя или администратора.",
  },
  {
    group: "Curator",
    method: "POST",
    path: "/api/curator/groups",
    access: "Admin/Curator",
    description: "Создание новой группы.",
  },
  {
    group: "Curator",
    method: "GET",
    path: "/api/curator/groups/[id]",
    access: "Admin/Curator",
    description: "Получение данных конкретной группы.",
  },
  {
    group: "Curator",
    method: "PATCH",
    path: "/api/curator/groups/[id]",
    access: "Admin/Curator",
    description: "Редактирование группы.",
  },
  {
    group: "Curator",
    method: "DELETE",
    path: "/api/curator/groups/[id]",
    access: "Admin/Curator",
    description: "Удаление группы.",
  },
  {
    group: "Curator",
    method: "GET",
    path: "/api/curator/groups/[id]/students",
    access: "Admin/Curator",
    description: "Получение списка учеников группы.",
  },
  {
    group: "Curator",
    method: "POST",
    path: "/api/curator/groups/[id]/students",
    access: "Admin/Curator",
    description: "Добавление ученика в группу.",
  },
  {
    group: "Curator",
    method: "DELETE",
    path: "/api/curator/groups/[id]/students/[studentId]",
    access: "Admin/Curator",
    description: "Удаление ученика из группы.",
  },
  {
    group: "Curator",
    method: "POST",
    path: "/api/curator/groups/[id]/students/import",
    access: "Admin/Curator",
    description: "Массовый импорт учеников в группу.",
  },
  {
    group: "Curator",
    method: "POST",
    path: "/api/curator/groups/[id]/unlock-up-to",
    access: "Admin/Curator",
    description: "Открытие уроков для группы до выбранного уровня.",
  },
];

const methodClass: Record<HttpMethod, string> = {
  GET: "bg-sky-50 text-sky-700 border-sky-200",
  POST: "bg-green-50 text-green-700 border-green-200",
  PATCH: "bg-amber-50 text-amber-700 border-amber-200",
  DELETE: "bg-red-50 text-red-700 border-red-200",
};

const accessClass: Record<Access, string> = {
  Public: "bg-gray-100 text-gray-600",
  Student: "bg-primary/10 text-primary",
  Curator: "bg-indigo-50 text-indigo-700",
  Admin: "bg-zinc-900 text-white",
  "Admin/Curator": "bg-violet-50 text-violet-700",
};

const groups = Array.from(new Set(endpoints.map((endpoint) => endpoint.group)));

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">
              Edu Platform
            </p>
            <h1 className="mt-2 text-3xl font-black text-gray-950 sm:text-4xl">
              API Documentation
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Список backend endpoint&apos;ов проекта: авторизация, прогресс, домашние работы,
              администрирование, группы и аналитика.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 shadow-sm transition hover:border-primary/40 hover:text-primary"
          >
            В приложение
          </Link>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Endpoint'ов" value={String(endpoints.length)} />
          <Stat label="Групп" value={String(groups.length)} />
          <Stat label="Методов" value="4" />
          <Stat label="Base URL" value="/api" compact />
        </section>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
          <div className="hidden grid-cols-[96px_minmax(260px,1fr)_140px_1.4fr] gap-4 border-b border-gray-100 bg-gray-50 px-5 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-gray-400 lg:grid">
            <div>Метод</div>
            <div>Endpoint</div>
            <div>Доступ</div>
            <div>Описание</div>
          </div>

          {groups.map((group) => (
            <section key={group}>
              <div className="border-b border-gray-100 bg-white px-5 py-3">
                <h2 className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
                  {group}
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {endpoints
                  .filter((endpoint) => endpoint.group === group)
                  .map((endpoint) => (
                    <article
                      key={`${endpoint.method}:${endpoint.path}`}
                      className="grid gap-3 px-5 py-4 transition hover:bg-gray-50/70 lg:grid-cols-[96px_minmax(260px,1fr)_140px_1.4fr] lg:items-center lg:gap-4"
                    >
                      <div>
                        <span
                          className={cn(
                            "inline-flex min-w-16 justify-center rounded-lg border px-2.5 py-1 text-xs font-black",
                            methodClass[endpoint.method]
                          )}
                        >
                          {endpoint.method}
                        </span>
                      </div>

                      <code className="break-all rounded-lg bg-gray-100 px-2.5 py-1.5 text-sm font-semibold text-gray-900">
                        {endpoint.path}
                      </code>

                      <div>
                        <span
                          className={cn(
                            "inline-flex rounded-lg px-2.5 py-1 text-xs font-bold",
                            accessClass[endpoint.access]
                          )}
                        >
                          {endpoint.access}
                        </span>
                      </div>

                      <p className="text-sm leading-6 text-gray-600">{endpoint.description}</p>
                    </article>
                  ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-black text-gray-950",
          compact ? "break-all text-base" : "text-2xl"
        )}
      >
        {value}
      </p>
    </div>
  );
}
