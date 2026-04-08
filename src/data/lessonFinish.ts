export interface LessonFinishContent {
  dashboardBadge?: string;
  dashboardHint?: string;
  practiceSummaryTitle?: string;
  practiceSummaryText?: string;
  practiceCta?: string;
  homeworkSubtitle?: string;
  homeworkSummaryTitle?: string;
  homeworkSummaryText?: string;
  homeworkReturnCta?: string;
  homeworkExamplesTitle?: string;
  homeworkHintStart?: string;
  homeworkHintCodex?: string;
}

const DEFAULT_FINISH_CONTENT: LessonFinishContent = {
  practiceCta: "Перейти к домашке →",
  homeworkSubtitle: "Домашняя работа отправлена на проверку",
  homeworkReturnCta: "Вернуться к уроку →",
  homeworkExamplesTitle: "Идеи что можно улучшить",
  homeworkHintStart:
    "Открой свой сайт в браузере и задай себе вопрос: «Чего здесь не хватает?» или «Что выглядит не так, как я хотел?» — это и будет твоё улучшение.",
  homeworkHintCodex:
    "Опиши конкретно — что именно изменить, где на странице, какого цвета или размера. Чем точнее запрос — тем лучше результат.",
};

export const lessonFinishContent: Record<string, LessonFinishContent> = {
  "lesson-1": {
    dashboardBadge: "Урок 1",
    dashboardHint: "Осваиваешь философию вайбкодинга",
    practiceSummaryTitle: "Что уже понимаешь",
    practiceSummaryText:
      "Что такое вайб-кодинг, как правильно начать с идеи, пять опор работы с ИИ и главные ошибки новичков.",
    practiceCta: "К домашнему заданию →",
    homeworkSubtitle: "Ты завершил первый урок по философии вайб-кодинга",
    homeworkSummaryTitle: "Уже сделано",
    homeworkSummaryText:
      "Ты разобрался, что такое вайб-кодинг, научился формулировать идею через три вопроса и понял базовый маршрут работы с ИИ.",
    homeworkReturnCta: "Вернуться к итогам урока →",
    homeworkExamplesTitle: "Что можно добавить к идее",
  },
  "lesson-2": {
    dashboardBadge: "Урок 2",
    dashboardHint: "Создаёшь презентации будущего с Gamma",
    practiceSummaryTitle: "Что уже умеешь",
    practiceSummaryText:
      "Работать с режимами Gamma, настраивать параметры генерации, проверять содержание и осознанно дорабатывать результат вручную.",
    practiceCta: "К домашнему заданию →",
    homeworkSubtitle: "Ты завершил урок про создание презентаций в Gamma",
    homeworkSummaryTitle: "Уже сделано",
    homeworkSummaryText:
      "Ты прошёл путь от текста до готовой презентации, выбрал настройки, доработал результат и научился критически проверять то, что делает ИИ.",
    homeworkReturnCta: "Вернуться к итогам урока →",
    homeworkExamplesTitle: "Что можно улучшить в следующий раз",
  },
  "lesson-3": {
    dashboardBadge: "Урок 3",
    dashboardHint: "Проектируешь визуальные концепты в Canva AI",
  },
  "lesson-4": {
    dashboardBadge: "Урок 4",
    dashboardHint: "Строишь профессиональный сайт в Tilda",
    practiceSummaryTitle: "Что уже умеешь",
    practiceSummaryText:
      "Описывать идею сайта для AI Assistant, проверять и дорабатывать результат, собирать уникальные блоки в Zero Block.",
    practiceCta: "К домашнему заданию →",
    homeworkSubtitle: "Ты завершил урок про создание сайта в Tilda",
    homeworkSummaryTitle: "Уже сделано",
    homeworkSummaryText:
      "Ты прошёл путь от описания идеи до готовой страницы: сгенерировал структуру, проверил и доработал её, добавил свой блок.",
    homeworkReturnCta: "Вернуться к итогам урока →",
    homeworkExamplesTitle: "Что можно улучшить на сайте дальше",
  },
  "lesson-codex-1": {
    dashboardBadge: "Урок 5",
    dashboardHint: "Собираешь первый сайт через Codex",
    practiceSummaryTitle: "Что уже умеешь",
    practiceSummaryText:
      "Выбирать тему, запускать проект в Codex, отвечать на уточнения и проверять готовый сайт в браузере.",
    practiceCta: "К домашке и улучшению сайта →",
    homeworkSubtitle: "Ты завершил урок про создание сайта через Codex",
    homeworkSummaryTitle: "Уже сделано",
    homeworkSummaryText:
      "Ты прошёл путь от идеи до первой версии сайта, проверил результат в браузере и готов к следующему улучшению.",
    homeworkReturnCta: "Вернуться к итогам урока →",
    homeworkExamplesTitle: "Что можно улучшить дальше",
  },
  "lesson-netlify-5": {
    dashboardBadge: "Урок 6",
    dashboardHint: "Улучшаешь сайт и публикуешь его",
    practiceSummaryTitle: "Что уже умеешь",
    practiceSummaryText:
      "Смотреть на сайт как пользователь, согласовывать улучшение, проверять новую версию и готовиться к публикации.",
    practiceCta: "К домашке и финальному шагу →",
    homeworkSubtitle: "Ты завершил урок про улучшение сайта и публикацию",
    homeworkSummaryTitle: "Уже сделано",
    homeworkSummaryText:
      "Ты усилил сайт, проверил новую версию, прошёл путь публикации через Netlify и получил рабочую ссылку.",
    homeworkReturnCta: "Вернуться к итогам урока →",
    homeworkExamplesTitle: "Примеры следующих улучшений",
    homeworkHintStart:
      "Открой опубликованную ссылку и спроси себя: что выглядит слабее всего для обычного посетителя? Что хочется улучшить следующим?",
    homeworkHintCodex:
      "Опиши конкретно, что улучшить на опубликованном сайте: какой блок, что в нём не так, что должно стать лучше.",
  },
  "lesson-7": {
    dashboardBadge: "Урок 7",
    dashboardHint: "Создаёшь первого Telegram-бота в Robochat",
  },
  "lesson-8": {
    dashboardBadge: "Урок 8",
    dashboardHint: "Подключаешь Make и AI API к боту",
  },
};

export function getLessonFinishContent(lessonId: string): LessonFinishContent {
  return {
    ...DEFAULT_FINISH_CONTENT,
    ...lessonFinishContent[lessonId],
  };
}
