// AI Creator module — first-pass content for all 10 lessons (6 common + 2 smart + 2 vip).
// Each lesson uses the same 5-step skeleton: warm-up quiz → prompt gallery →
// action (open tool) → checklist → homework submission. Designed so students
// can copy a curated prompt, paste it into the target tool, and ship a result.

import type { StudyLessonContent } from "@/types/study";

// ─── Lesson 1: Введение — что такое ИИ? ──────────────────────────────────────
export const AI_CREATOR_1_CONTENT: StudyLessonContent = {
  landing: {
    youtubeVideoId: "FhIhKN_wJe0",
    recap:
      "ИИ-генеративные модели рисуют, снимают и сочиняют не «потому что понимают», а потому что обучены на миллиардах примеров. Главный навык AI Creator — не «нажать кнопку», а уметь точно описать, что ты хочешь увидеть. В этом уроке знакомимся с инструментами, которые будем использовать дальше: Midjourney, Runway, Veo, Lyria, Kling.",
    anchors: [
      { time: "01:30", seconds: 90, label: "что такое генеративный ИИ простыми словами" },
      { time: "05:00", seconds: 300, label: "карта инструментов: фото / видео / музыка" },
      { time: "09:00", seconds: 540, label: "как читать «качественный» промт" },
    ],
  },
  steps: [
    {
      n: 1,
      completion: { type: "practice", key: "step-1" },
      caption: "ШАГ 1 ИЗ 5 · РАЗОГРЕВ",
      title: "Что мы будем делать в модуле AI Creator?",
      description: "Три вопроса, чтобы поймать главную идею.",
      kind: "which-tag-mini",
      content: {
        questions: [
          { id: "q1", text: "Что главное в работе AI Creator?", options: ["Нажать «Generate» и взять первый результат", "Точно описать, что хочешь, и итеративно улучшать", "Купить самую дорогую подписку"], correctIndex: 1, explanation: "Качество результата = качество запроса × количество итераций." },
          { id: "q2", text: "Почему ИИ выдаёт разные результаты на один промт?", options: ["Глюк", "Случайный seed — модель каждый раз идёт чуть другим путём", "Это баг подписки"], correctIndex: 1, explanation: "Seed (зерно генерации) задаёт случайность; чем точнее промт, тем стабильнее результат." },
          { id: "q3", text: "Что нельзя делать с генеративным ИИ?", options: ["Создавать постеры школьных мероприятий", "Делать дипфейки реальных людей без их согласия", "Генерить иллюстрации для эссе"], correctIndex: 1, explanation: "Лица и голоса реальных людей — только с согласия. Это не творчество, а нарушение." },
        ],
      },
    },
    {
      n: 2,
      completion: { type: "practice", key: "step-2" },
      caption: "ШАГ 2 ИЗ 5 · ГАЛЕРЕЯ",
      title: "Готовые промты-шаблоны для разминки",
      description: "Скопируй любой и сгенерируй своё первое изображение в Midjourney или Gemini.",
      kind: "prompt-gallery",
      content: {
        targetTool: "Midjourney или Gemini Image",
        targetUrl: "https://www.midjourney.com",
        copiesRequired: 1,
        items: [
          {
            id: "p1",
            label: "Кот-космонавт",
            tool: "Midjourney",
            style: "sci-fi cute",
            prompt:
              "A cute cat astronaut floating inside a spaceship window, Earth glowing in the background, soft cinematic light, detailed fur, playful expression, ultra-detailed, 35mm photography look --ar 16:9",
            previewImageUrl: "/ai-creator/preview/lesson-1/space-cat.webp",
          },
          {
            id: "p2",
            label: "Киберпанк-лиса",
            tool: "Midjourney",
            style: "cyberpunk",
            prompt:
              "A cyberpunk fox wearing a neon jacket in a rainy futuristic alley, glowing signs reflected in puddles, cinematic lighting, ultra-detailed fur, vibrant magenta and cyan palette --ar 3:4",
            previewImageUrl: "/ai-creator/preview/lesson-1/cyberpunk-fox.webp",
          },
          {
            id: "p3",
            label: "Книга оживает",
            tool: "Midjourney",
            style: "fantasy illustration",
            prompt:
              "Open book with magical light spilling out of its pages, paper birds flying upward, golden particles, warm sunset colors, intricate details, fantasy illustration --ar 3:4",
            previewImageUrl: "/ai-creator/preview/lesson-1/magic-book.webp",
          },
          {
            id: "p4",
            label: "Робот-студент",
            tool: "Gemini Image",
            style: "friendly robot",
            prompt:
              "A friendly robot student sitting at a school desk, notebook open, warm classroom light, curious eyes, colorful educational atmosphere, polished 3D illustration --ar 4:5",
            previewImageUrl: "/ai-creator/preview/lesson-1/robot-student.webp",
          },
          {
            id: "p5",
            label: "Пиксель-дракон",
            tool: "Midjourney",
            style: "pixel art",
            prompt:
              "A tiny pixel-art dragon guarding a glowing treasure chest, cozy cave background, 16-bit game style, crisp pixels, charming fantasy mood --ar 1:1",
            previewImageUrl: "/ai-creator/preview/lesson-1/pixel-dragon.webp",
          },
        ],
        successNote: "Один промт в кармане — теперь сгенерируй свой первый кадр.",
      },
    },
    {
      n: 3,
      completion: { type: "practice", key: "step-3" },
      caption: "ШАГ 3 ИЗ 5 · ГЕНЕРАЦИЯ",
      title: "Сгенерируй первое изображение",
      description: "Открой инструмент и запусти промт из шага 2.",
      kind: "action-step",
      content: {
        videoStartSeconds: 120,
        checkboxLabel: "Я получил минимум 4 варианта и выбрал лучший",
        doneLabel: "Первое изображение готово",
        instructions: [
          "Открой Midjourney (через Discord или midjourney.com) или alternativ — Gemini Image.",
          "Вставь промт из шага 2 и запусти генерацию.",
          "Дождись результатов (обычно 30–90 секунд). Получишь 4 варианта.",
          "Выбери самый удачный — увеличь / сохрани в высоком разрешении.",
        ],
        note: "Если результат сухой — добавь в конец промта `--stylize 750` или поменяй стилевые слова.",
      },
    },
    {
      n: 4,
      completion: { type: "practice", key: "step-4" },
      caption: "ШАГ 4 ИЗ 5 · ПРОВЕРКА",
      title: "Чек-лист первого результата",
      description: "Перед сдачей пройди 4 пункта.",
      kind: "checklist",
      content: {
        items: [
          { id: "c1", question: "Изображение соответствует тому, что описано в промте?", hintIfNo: "Если нет — добавь точные детали (количество объектов, цвета, ракурс) и перегенерируй." },
          { id: "c2", question: "Я НЕ использовал в промте имена реальных людей?", hintIfNo: "Замени имена на описание («подросток», «мужчина в очках»). ИИ-копии реальных лиц — это дипфейк." },
          { id: "c3", question: "У результата нет очевидных артефактов (шесть пальцев, странный текст)?", hintIfNo: "Перегенерируй или используй inpainting / Vary Region для проблемного места." },
          { id: "c4", question: "Сохранил картинку в высоком разрешении (минимум 2K)?", hintIfNo: "В Midjourney нажми «Upscale» или «U1–U4». В Gemini — сохраняй из меню «Высокое качество»." },
        ],
      },
    },
    {
      n: 5,
      completion: { type: "submission" },
      caption: "ШАГ 5 ИЗ 5 · СДАЧА",
      title: "Сдача учителю",
      description: "Покажи свой первый кадр в Google Meet.",
    },
  ],
};

// ─── Lesson 2: Prompt Engineering ────────────────────────────────────────────
export const AI_CREATOR_2_CONTENT: StudyLessonContent = {
  landing: {
    youtubeVideoId: "Ssoo7jSkzSY",
    recap:
      "Промт-инжиниринг для генерации изображений строится по формуле: Subject (что) + Style (как) + Composition (с какого ракурса) + Lighting (какой свет) + Modifiers (детали). Чем точнее каждый блок — тем меньше «лотереи» в результате.",
    anchors: [
      { time: "01:00", seconds: 60, label: "5 элементов любого качественного промта" },
      { time: "06:00", seconds: 360, label: "стилевые модификаторы и где их брать" },
      { time: "11:00", seconds: 660, label: "как читать negative prompts" },
    ],
  },
  steps: [
    {
      n: 1,
      completion: { type: "practice", key: "step-1" },
      caption: "ШАГ 1 ИЗ 5 · РАЗОГРЕВ",
      title: "Из чего собирается хороший промт?",
      description: "Три быстрых вопроса.",
      kind: "which-tag-mini",
      content: {
        questions: [
          { id: "q1", text: "Какой промт даст более предсказуемый результат?", options: ["«красивая девушка»", "«portrait of a young woman, soft window light, 50mm lens, kodak portra colors, calm expression»", "«сделай красиво»"], correctIndex: 1, explanation: "Subject + lighting + camera + colors + mood — каждое уточнение убирает «лотерею»." },
          { id: "q2", text: "Зачем добавлять стилевые модификаторы (cinematic, anime, oil painting)?", options: ["Чтобы выглядеть умным", "Чтобы зафиксировать визуальный язык — ИИ не угадает сам", "Это требование подписки"], correctIndex: 1, explanation: "Без стиля модель идёт «среднестатистическим» путём — получишь скучную картинку." },
          { id: "q3", text: "Что делает negative prompt (например, `--no text, blurry`)?", options: ["Ничего", "Говорит модели чего НЕ должно быть в кадре", "Удаляет результат"], correctIndex: 1, explanation: "Negative prompts — мощный фильтр против артефактов и лишних элементов." },
        ],
      },
    },
    {
      n: 2,
      completion: { type: "practice", key: "step-2" },
      caption: "ШАГ 2 ИЗ 5 · ГАЛЕРЕЯ",
      title: "5 промт-формул на разные настроения",
      description: "Скопируй ту, чей стиль тебе ближе, и подставь свой Subject.",
      kind: "prompt-gallery",
      content: {
        targetTool: "Midjourney",
        targetUrl: "https://www.midjourney.com",
        copiesRequired: 1,
        items: [
          {
            id: "p1",
            label: "Кинематографичный портрет",
            tool: "Midjourney",
            style: "cinematic",
            prompt:
              "Cinematic portrait of [SUBJECT], anamorphic lens flare, soft rim light from the left, shallow depth of field, kodak vision3 color grade, 35mm film grain, dramatic shadows --ar 2:3 --style raw",
            previewImageUrl: "/ai-creator/preview/lesson-2/knight-portrait.webp",
          },
          {
            id: "p2",
            label: "Аниме-кадр",
            tool: "Midjourney",
            style: "anime",
            prompt:
              "[SUBJECT] in the style of modern anime, key frame illustration, vibrant cel-shading, expressive eyes, dynamic pose, soft sunset light, Makoto Shinkai inspired backgrounds --ar 16:9 --niji 6",
            previewImageUrl: "/ai-creator/preview/lesson-2/wizard-fire.webp",
          },
          {
            id: "p3",
            label: "3D-рендер игрушки",
            tool: "Midjourney",
            style: "3d toy",
            prompt:
              "Cute collectible figurine of [SUBJECT], soft pastel colors, glossy plastic finish, studio lighting, white seamless background, octane render, ultra-detailed, isometric angle --ar 1:1",
            previewImageUrl: "/ai-creator/preview/lesson-2/futuristic-chef.webp",
          },
          {
            id: "p4",
            label: "Архитектурный концепт",
            tool: "Midjourney",
            style: "architectural",
            prompt:
              "Architectural concept of [SUBJECT], brutalist meets parametric design, golden hour light, ground-up perspective, ultrawide 14mm lens, photoreal, atmospheric haze --ar 21:9",
          },
          {
            id: "p5",
            label: "Иллюстрация в стиле Ghibli",
            tool: "Midjourney",
            style: "ghibli",
            prompt:
              "[SUBJECT] in Studio Ghibli style, hand-painted backgrounds, warm pastel palette, soft cumulus clouds, gentle wind moving the grass, nostalgic mood, watercolor textures --ar 16:9",
            previewImageUrl: "/ai-creator/preview/lesson-2/basketball-jump.webp",
          },
        ],
        successNote: "Подставь свой Subject в [SUBJECT] и сгенерируй.",
      },
    },
    {
      n: 3,
      completion: { type: "practice", key: "step-3" },
      caption: "ШАГ 3 ИЗ 5 · ГЕНЕРАЦИЯ",
      title: "Подставь Subject и сгенерируй 2 версии",
      description: "Сгенерь дважды с разными формулами — сравни.",
      kind: "action-step",
      content: {
        videoStartSeconds: 240,
        checkboxLabel: "Сгенерировал минимум 2 варианта по разным формулам",
        doneLabel: "Сравнение готово",
        instructions: [
          "Открой Midjourney.",
          "Возьми любые 2 формулы из шага 2 — подставь один и тот же Subject.",
          "Запусти обе. Получишь 2 × 4 = 8 вариантов.",
          "Положи рядом лучшие из каждой пары — увидишь, как «формула» меняет всё.",
        ],
        note: "Эту привычку — генерить «двумя путями» — сохраняй на весь курс. Так ты быстро находишь нужный визуальный язык.",
      },
    },
    {
      n: 4,
      completion: { type: "practice", key: "step-4" },
      caption: "ШАГ 4 ИЗ 5 · ПРОВЕРКА",
      title: "Финальный чек-лист промта",
      description: "Перед сдачей пройди по 4 пунктам.",
      kind: "checklist",
      content: {
        items: [
          { id: "c1", question: "В моём промте чётко прописан Subject?", hintIfNo: "Замени «человек» на «подросток в красной куртке, смотрит вверх»." },
          { id: "c2", question: "Указан Style (cinematic / anime / 3D и т.д.)?", hintIfNo: "Без стиля модель идёт по умолчанию — добавь хотя бы одно стилевое слово." },
          { id: "c3", question: "Прописан Lighting (тип света)?", hintIfNo: "«golden hour», «soft window light», «studio rim light» — выбирай и добавляй." },
          { id: "c4", question: "Указано соотношение сторон (--ar)?", hintIfNo: "Без --ar получишь квадрат. Для постера 2:3, для кадра 16:9, для сторис 9:16." },
        ],
      },
    },
    {
      n: 5,
      completion: { type: "submission" },
      caption: "ШАГ 5 ИЗ 5 · СДАЧА",
      title: "Сдача учителю",
      description: "Покажи 2 версии в Google Meet и расскажи, какая формула победила.",
    },
  ],
};

// ─── Lesson 3: Фото-генерация ────────────────────────────────────────────────
export const AI_CREATOR_3_CONTENT: StudyLessonContent = {
  landing: {
    youtubeVideoId: "8gpxwIzvOVQ",
    recap:
      "Фото-генерация — это управляемая фотореалистичная съёмка без камеры. Главные рычаги: камера/объектив (35mm, 85mm), плёнка (Portra 400, Cinestill 800T), свет (rim, soft, golden hour) и ракурс. Эту лексику берут из языка реальной фотографии — чем точнее, тем «фотографичнее» результат.",
    anchors: [
      { time: "02:00", seconds: 120, label: "почему фотореализм требует фото-лексики" },
      { time: "06:30", seconds: 390, label: "плёночные модификаторы и их магия" },
      { time: "11:00", seconds: 660, label: "ошибка №1 — лица без структуры света" },
    ],
  },
  steps: [
    {
      n: 1,
      completion: { type: "practice", key: "step-1" },
      caption: "ШАГ 1 ИЗ 5 · РАЗОГРЕВ",
      title: "Камера, плёнка, свет",
      description: "Три вопроса про язык реальной фотографии.",
      kind: "which-tag-mini",
      content: {
        questions: [
          { id: "q1", text: "Какой объектив сжимает фон и хорошо подходит для портретов?", options: ["14mm wide", "85mm prime", "Fish-eye"], correctIndex: 1, explanation: "85mm сжимает перспективу и красиво размывает фон — золотой стандарт портрета." },
          { id: "q2", text: "Что такое golden hour?", options: ["Час платной подписки", "Тёплый низкий свет за час до заката или после рассвета", "Любой яркий свет"], correctIndex: 1, explanation: "Это именно та лексика, которую модель умеет читать — добавь в промт и получишь правильную атмосферу." },
          { id: "q3", text: "Зачем писать в промте «Kodak Portra 400»?", options: ["Чтобы хвастаться", "Чтобы получить характерные мягкие тёплые тона этой плёнки", "Это код активации"], correctIndex: 1, explanation: "Названия реальных плёнок — самые мощные стилистические якоря для фотореализма." },
        ],
      },
    },
    {
      n: 2,
      completion: { type: "practice", key: "step-2" },
      caption: "ШАГ 2 ИЗ 5 · ГАЛЕРЕЯ",
      title: "5 фотореалистичных шаблонов",
      description: "Скопируй и подставь свой Subject и место.",
      kind: "prompt-gallery",
      content: {
        targetTool: "Midjourney",
        targetUrl: "https://www.midjourney.com",
        copiesRequired: 1,
        items: [
          {
            id: "p1",
            label: "Портрет на плёнку",
            tool: "Midjourney",
            style: "film portrait",
            prompt:
              "Photorealistic portrait of [SUBJECT], 85mm prime lens, soft north window light, Kodak Portra 400 film, natural skin tones, gentle film grain, calm expression --ar 4:5 --style raw",
            previewImageUrl: "/ai-creator/preview/lesson-3/cozy-forest-house.webp",
          },
          {
            id: "p2",
            label: "Уличная съёмка",
            tool: "Midjourney",
            style: "street",
            prompt:
              "Documentary street photography of [SUBJECT] in [CITY], 35mm Leica, candid moment, late afternoon golden light, Cinestill 800T film, slight motion blur, soft contrast --ar 3:2",
            previewImageUrl: "/ai-creator/preview/lesson-3/modern-house.webp",
          },
          {
            id: "p3",
            label: "Студийный коммерс",
            tool: "Midjourney",
            style: "studio",
            prompt:
              "Studio commercial photo of [SUBJECT], Profoto strobe lighting, three-point setup, seamless white background, hasselblad medium format, ultra sharp, advertising quality --ar 1:1",
            previewImageUrl: "/ai-creator/preview/lesson-3/scifi-house.webp",
          },
          {
            id: "p4",
            label: "Архитектура с дрона",
            tool: "Midjourney",
            style: "drone",
            prompt:
              "Aerial drone shot of [PLACE], top-down 90° angle, golden hour, long shadows, Mavic 3 Pro Hasselblad camera, ultra-detailed, atmospheric, photoreal --ar 16:9",
            previewImageUrl: "/ai-creator/preview/lesson-3/horror-house.webp",
          },
          {
            id: "p5",
            label: "Природа на закате",
            tool: "Midjourney",
            style: "landscape",
            prompt:
              "Wide landscape of [PLACE] at sunset, Sony A7R V with 24-70mm GM, vibrant warm sky, leading lines, ND filter, RAW colors, ultra-realistic, National Geographic style --ar 21:9",
            previewImageUrl: "/ai-creator/preview/lesson-3/anime-cottage.webp",
          },
        ],
        successNote: "Подставь Subject + место и запускай.",
      },
    },
    {
      n: 3,
      completion: { type: "practice", key: "step-3" },
      caption: "ШАГ 3 ИЗ 5 · ГЕНЕРАЦИЯ",
      title: "Сгенерируй фотореалистичный кадр",
      description: "Подставь свои Subject и место.",
      kind: "action-step",
      content: {
        videoStartSeconds: 360,
        checkboxLabel: "У меня есть минимум 1 фотореалистичный кадр",
        doneLabel: "Кадр готов",
        instructions: [
          "Открой Midjourney.",
          "Возьми один шаблон из шага 2 и подставь Subject + место (например: «teenager in school uniform», «Almaty rooftops»).",
          "Запусти. Если кадр получился «иллюстративным» — добавь `--style raw` и слово «photoreal».",
          "Сохрани upscale.",
        ],
        note: "Если лица искажены — увеличь только лицо через Vary Region и попроси «detailed natural face features».",
      },
    },
    {
      n: 4,
      completion: { type: "practice", key: "step-4" },
      caption: "ШАГ 4 ИЗ 5 · ПРОВЕРКА",
      title: "Чек-лист фотореализма",
      description: "Что проверить перед сдачей.",
      kind: "checklist",
      content: {
        items: [
          { id: "c1", question: "Кадр выглядит как фото, а не как иллюстрация?", hintIfNo: "Добавь название камеры/объектива/плёнки и `--style raw`." },
          { id: "c2", question: "У людей нормальные лица и руки (без шести пальцев)?", hintIfNo: "Используй Vary Region на проблемной зоне или сгенерируй заново." },
          { id: "c3", question: "Свет работает — есть направление, тени, объём?", hintIfNo: "Добавь явное освещение: «soft window light», «rim light from the right»." },
          { id: "c4", question: "Цвета не «пластиковые»?", hintIfNo: "Добавь «kodak portra», «cinestill», «muted tones» — реальные плёнки сразу убирают цифровой пластик." },
        ],
      },
    },
    {
      n: 5,
      completion: { type: "submission" },
      caption: "ШАГ 5 ИЗ 5 · СДАЧА",
      title: "Сдача учителю",
      description: "Покажи свой фотореалистичный кадр в Google Meet.",
    },
  ],
};

// ─── Lesson 4: FaceSwap ──────────────────────────────────────────────────────
export const AI_CREATOR_4_CONTENT: StudyLessonContent = {
  landing: {
    youtubeVideoId: "vha4Ws2j25A",
    recap:
      "FaceSwap — мощный, но опасный инструмент. Этический контракт: ставим только своё лицо или лицо человека с явным разрешением, никогда не используем для розыгрышей и фейков. Технически — InsightFaceSwap бот в Discord или Akool Online. Главное — качественное исходное фото лица в высоком разрешении.",
    anchors: [
      { time: "01:30", seconds: 90, label: "этика FaceSwap — что МОЖНО, что НЕТ" },
      { time: "06:00", seconds: 360, label: "InsightFaceSwap бот в Discord" },
      { time: "10:30", seconds: 630, label: "когда использовать Akool как альтернативу" },
    ],
  },
  steps: [
    {
      n: 1,
      completion: { type: "practice", key: "step-1" },
      caption: "ШАГ 1 ИЗ 5 · ЭТИКА",
      title: "Кодекс FaceSwap-художника",
      description: "Три вопроса про границы.",
      kind: "which-tag-mini",
      content: {
        questions: [
          { id: "q1", text: "Можно ли подставить лицо одноклассника, который не знает?", options: ["Можно — это шутка", "Нельзя ни в каком виде — это нарушение", "Можно, если получится смешно"], correctIndex: 1, explanation: "Без явного согласия — это создание deepfake. Платформы и закон такое наказывают." },
          { id: "q2", text: "Что подходит для FaceSwap?", options: ["Своё лицо или лицо с письменным разрешением", "Любое лицо знаменитости", "Случайные фото из интернета"], correctIndex: 0, explanation: "Своё лицо или с разрешения. Всё остальное — серая или красная зона." },
          { id: "q3", text: "Какое исходное фото даст лучший результат?", options: ["Селфи с фронталки в темноте", "Чёткий портрет анфас при равномерном свете, минимум 1024×1024", "Групповое фото"], correctIndex: 1, explanation: "Алгоритму нужны хорошо видимые черты лица. Чем чище исходник — тем чище swap." },
        ],
      },
    },
    {
      n: 2,
      completion: { type: "practice", key: "step-2" },
      caption: "ШАГ 2 ИЗ 5 · ГАЛЕРЕЯ",
      title: "5 безопасных промтов «куда подставить лицо»",
      description: "Сначала сгенерируй базовое изображение, потом сделаешь FaceSwap своего лица.",
      kind: "prompt-gallery",
      content: {
        targetTool: "Midjourney → InsightFaceSwap (Discord) или Akool",
        targetUrl: "https://akool.com/apps/faceswap",
        copiesRequired: 1,
        items: [
          {
            id: "p1",
            label: "Космонавт",
            tool: "Midjourney",
            style: "sci-fi portrait",
            prompt:
              "Half-body portrait of an astronaut in a clean white space suit, helmet off, soft cinematic lighting, neutral facial expression front-facing, photoreal, 85mm lens --ar 2:3 --style raw",
            previewImageUrl: "/ai-creator/preview/lesson-4/astronaut-portrait.webp",
          },
          {
            id: "p2",
            label: "Средневековый рыцарь",
            tool: "Midjourney",
            style: "historical",
            prompt:
              "Half-body portrait of a medieval knight without helmet, polished armor, neutral expression, front-facing, soft north light, photorealistic, oil painting touch --ar 2:3",
            previewImageUrl: "/ai-creator/preview/lesson-4/roman-senator.webp",
          },
          {
            id: "p3",
            label: "Олимпийский атлет",
            tool: "Midjourney",
            style: "sport",
            prompt:
              "Half-body portrait of a young athlete in olympic uniform, gold medal around the neck, neutral confident expression facing camera, stadium background bokeh, golden hour --ar 2:3 --style raw",
            previewImageUrl: "/ai-creator/preview/lesson-4/business-ny.webp",
          },
          {
            id: "p4",
            label: "Учёный в лаборатории",
            tool: "Midjourney",
            style: "documentary",
            prompt:
              "Half-body portrait of a young scientist in a clean modern lab, white coat, glasses, neutral expression front-facing, soft daylight from window, photoreal --ar 2:3",
            previewImageUrl: "/ai-creator/preview/lesson-4/victorian-noble.webp",
          },
          {
            id: "p5",
            label: "Музыкант на сцене",
            tool: "Midjourney",
            style: "concert",
            prompt:
              "Half-body portrait of a musician on stage with a guitar, single key spotlight, neutral focused expression, front-facing, soft smoke in the air, photoreal concert photography --ar 2:3",
          },
        ],
        successNote: "База готова — теперь FaceSwap своего лица в Akool или InsightFaceSwap.",
      },
    },
    {
      n: 3,
      completion: { type: "practice", key: "step-3" },
      caption: "ШАГ 3 ИЗ 5 · FACESWAP",
      title: "Сделай свап своего лица",
      description: "Aкол или InsightFaceSwap — выбирай удобнее.",
      kind: "action-step",
      content: {
        videoStartSeconds: 480,
        checkboxLabel: "Я сделал FaceSwap со своим (или согласованным) лицом",
        doneLabel: "Свап готов",
        instructions: [
          "Открой akool.com/apps/faceswap (без регистрации можно сразу) или Discord-бот InsightFaceSwap.",
          "Загрузи источник: чёткий портрет лица анфас, минимум 1024×1024.",
          "Загрузи целевую картинку из шага 2.",
          "Запусти swap. Если результат «пластиковый» — попробуй другой исходник лица или повторно прогони.",
        ],
        note: "Никогда не подставляй лицо человека, который не давал разрешения. Это правило выше любых «прикольно».",
      },
    },
    {
      n: 4,
      completion: { type: "practice", key: "step-4" },
      caption: "ШАГ 4 ИЗ 5 · ПРОВЕРКА",
      title: "Чек-лист безопасного свапа",
      description: "Перед публикацией пройди по 4 пунктам.",
      kind: "checklist",
      content: {
        items: [
          { id: "c1", question: "Я использовал своё лицо или лицо с разрешением (письменным/устным под запись)?", hintIfNo: "Останови. Без согласия — не публикуй и удали." },
          { id: "c2", question: "Свап не пытается выдать себя за реальное событие (фейковая новость, скандал)?", hintIfNo: "Если да — не публикуй. Это deepfake." },
          { id: "c3", question: "Я добавлю подпись «AI generated / FaceSwap» при публикации?", hintIfNo: "Прозрачность — обязательная часть этики. Подписывай AI-контент." },
          { id: "c4", question: "Лицо хорошо «село» на голову в кадре (без шва на щеке)?", hintIfNo: "Перегенерируй. Иногда помогает поменять источник на другое фото с тем же светом." },
        ],
      },
    },
    {
      n: 5,
      completion: { type: "submission" },
      caption: "ШАГ 5 ИЗ 5 · СДАЧА",
      title: "Сдача учителю",
      description: "Покажи свап в Google Meet и расскажи, чьё лицо использовал и кто дал разрешение.",
    },
  ],
};

// ─── Lesson 5: Оживление фото ────────────────────────────────────────────────
export const AI_CREATOR_5_CONTENT: StudyLessonContent = {
  landing: {
    youtubeVideoId: "hvCGDMCaK_g",
    recap:
      "Image-to-video — берём готовое изображение и просим ИИ его оживить: ветер в волосах, мигание, движение камеры. Лучшие инструменты в 2026: Runway Gen-3, Kling 2.0, Luma Ray, Pika 2. Главное правило — короткий и точный motion prompt: «slow camera dolly in», «wind moves the leaves», «subject blinks slowly».",
    anchors: [
      { time: "01:30", seconds: 90, label: "image-to-video — что это" },
      { time: "06:00", seconds: 360, label: "формула motion prompt" },
      { time: "12:00", seconds: 720, label: "Runway vs Kling vs Luma — когда что" },
    ],
  },
  steps: [
    {
      n: 1,
      completion: { type: "practice", key: "step-1" },
      caption: "ШАГ 1 ИЗ 5 · РАЗОГРЕВ",
      title: "Что описывает motion prompt?",
      description: "Три вопроса.",
      kind: "which-tag-mini",
      content: {
        questions: [
          { id: "q1", text: "Что в motion prompt важнее — детали кадра или движение?", options: ["Детали — модель сама поймёт движение", "Движение и его направление — детали уже есть в исходной картинке", "Без разницы"], correctIndex: 1, explanation: "Картинку модель видит. Ей нужно сказать только про движение — куда и как." },
          { id: "q2", text: "Какой motion prompt сработает лучше?", options: ["«сделай красиво»", "«slow dolly-in, subject blinks once, gentle wind in the hair»", "«анимируй»"], correctIndex: 1, explanation: "Конкретные глаголы движения + направление = чёткое видео." },
          { id: "q3", text: "Сколько обычно длится одна генерация image-to-video?", options: ["1 секунда — ничего не успеешь", "5–10 секунд — самый ходовой формат", "1 минута"], correctIndex: 1, explanation: "Большинство моделей дают 5 или 10 секунд за один запуск. Дольше — клеишь несколько." },
        ],
      },
    },
    {
      n: 2,
      completion: { type: "practice", key: "step-2" },
      caption: "ШАГ 2 ИЗ 5 · ГАЛЕРЕЯ",
      title: "5 motion-промтов на разные настроения",
      description: "Выбирай под характер своей картинки.",
      kind: "prompt-gallery",
      content: {
        targetTool: "Runway Gen-3 / Kling 2.0 / Luma Ray",
        targetUrl: "https://runwayml.com",
        copiesRequired: 1,
        items: [
          {
            id: "p1",
            label: "Кинематографичный въезд",
            tool: "Runway Gen-3",
            style: "cinematic dolly",
            prompt:
              "Slow cinematic dolly-in towards the subject, gentle parallax on background elements, subject blinks once at the end, soft anamorphic depth of field",
            previewImageUrl: "/ai-creator/preview/lesson-5/elderly-couple.webp",
          },
          {
            id: "p2",
            label: "Ветер и атмосфера",
            tool: "Runway Gen-3",
            style: "atmospheric",
            prompt:
              "Subject stays still, gentle wind moves the hair and clothing, dust particles drift slowly through the air from left to right, soft volumetric light",
            previewImageUrl: "/ai-creator/preview/lesson-5/grandmother.webp",
          },
          {
            id: "p3",
            label: "Парящая камера",
            tool: "Kling 2.0",
            style: "drone-like",
            prompt:
              "Smooth aerial-style camera arc circling the subject 120 degrees, slight upward tilt at the end, leaves and grass animate in the breeze, golden hour bloom",
            previewImageUrl: "/ai-creator/preview/lesson-5/vintage-wedding.webp",
          },
          {
            id: "p4",
            label: "Микро-движения портрета",
            tool: "Luma Ray",
            style: "subtle portrait",
            prompt:
              "Subject slowly turns head 15 degrees toward camera, eyes blink twice naturally, hair settles, very subtle smile forms, static camera, photoreal",
            previewImageUrl: "/ai-creator/preview/lesson-5/grandfather.webp",
          },
          {
            id: "p5",
            label: "Динамичный action",
            tool: "Kling 2.0",
            style: "action",
            prompt:
              "Camera tracks the subject moving forward, motion blur on background, dust kicks up, dramatic side light, subject's hair flows backward from the speed",
          },
        ],
        successNote: "Подбери motion-промт под свою картинку и оживи.",
      },
    },
    {
      n: 3,
      completion: { type: "practice", key: "step-3" },
      caption: "ШАГ 3 ИЗ 5 · ОЖИВЛЕНИЕ",
      title: "Загрузи свою картинку и запусти",
      description: "Берём картинку из урока 3 и оживляем.",
      kind: "action-step",
      content: {
        videoStartSeconds: 540,
        checkboxLabel: "Я получил минимум один 5-секундный клип",
        doneLabel: "Картинка ожила",
        instructions: [
          "Открой Runway, Kling или Luma Ray.",
          "Загрузи картинку из урока 3 (фото-генерация) — она у тебя уже есть.",
          "Вставь motion-промт из шага 2 в поле «Motion / Prompt».",
          "Запусти. Генерация занимает 1–3 минуты.",
        ],
        note: "Если движение слишком хаотичное — уменьши «motion strength» (в Runway это слайдер).",
      },
    },
    {
      n: 4,
      completion: { type: "practice", key: "step-4" },
      caption: "ШАГ 4 ИЗ 5 · ПРОВЕРКА",
      title: "Чек-лист анимации",
      description: "4 пункта качества.",
      kind: "checklist",
      content: {
        items: [
          { id: "c1", question: "Движение в кадре соответствует тому, что я описал в промте?", hintIfNo: "Перегенерируй с более конкретным глаголом движения и направлением." },
          { id: "c2", question: "Лицо/руки не «плывут» уродливо во время движения?", hintIfNo: "Уменьши motion strength или добавь негативный промт «no morphing, no warping»." },
          { id: "c3", question: "Длительность подходит под задачу (5 сек хватит — или нужен 10 сек)?", hintIfNo: "Генерируй вторую часть и склеишь в любом видеоредакторе." },
          { id: "c4", question: "Звука нет — это нормально для image-to-video?", hintIfNo: "Да, звук добавляется отдельно (например, в Lyria — урок 8 smart-трека)." },
        ],
      },
    },
    {
      n: 5,
      completion: { type: "submission" },
      caption: "ШАГ 5 ИЗ 5 · СДАЧА",
      title: "Сдача учителю",
      description: "Покажи 5-секундный клип в Google Meet.",
    },
  ],
};

// ─── Lesson 6: ИИ Постеры ────────────────────────────────────────────────────
export const AI_CREATOR_6_CONTENT: StudyLessonContent = {
  landing: {
    youtubeVideoId: "10RYR4Dimc0",
    recap:
      "Постер — это композиция: главный объект, фон, типографика, цветовая палитра. ИИ хорошо рисует фон и графику, плохо — текст. Поэтому стратегия: генерим визуальную базу в Midjourney → довеёрстываем заголовок и логотип в Canva или Figma. Так мы получаем профессиональный постер без дизайнерских курсов.",
    anchors: [
      { time: "01:30", seconds: 90, label: "что такое сильный постер" },
      { time: "07:00", seconds: 420, label: "почему ИИ ломает текст и как это обойти" },
      { time: "12:00", seconds: 720, label: "финальная вёрстка в Canva" },
    ],
  },
  steps: [
    {
      n: 1,
      completion: { type: "practice", key: "step-1" },
      caption: "ШАГ 1 ИЗ 5 · РАЗОГРЕВ",
      title: "Анатомия постера",
      description: "Три вопроса перед практикой.",
      kind: "which-tag-mini",
      content: {
        questions: [
          { id: "q1", text: "Почему ИИ плохо рисует текст на постерах?", options: ["Не хватает мощности", "Модель видит буквы как картинки, а не как символы — отсюда «нечитабельные» закорючки", "Это специально"], correctIndex: 1, explanation: "Поэтому стратегия: визуал в Midjourney → текст вёрстаем в Canva/Figma." },
          { id: "q2", text: "Что важнее в постере: главный объект или фон?", options: ["Фон", "Главный объект и контраст с фоном — он должен «звучать»", "Не важно"], correctIndex: 1, explanation: "Без чёткого main subject постер становится шумом." },
          { id: "q3", text: "Какое соотношение сторон обычно у постера?", options: ["1:1 (квадрат)", "2:3 или 3:4 (вертикальный)", "16:9"], correctIndex: 1, explanation: "Классический формат A3/A4. Делай `--ar 2:3` сразу в промте." },
        ],
      },
    },
    {
      n: 2,
      completion: { type: "practice", key: "step-2" },
      caption: "ШАГ 2 ИЗ 5 · ГАЛЕРЕЯ",
      title: "5 постер-формул",
      description: "Выбери стиль под свою тему.",
      kind: "prompt-gallery",
      content: {
        targetTool: "Midjourney → Canva (для текста)",
        targetUrl: "https://www.midjourney.com",
        copiesRequired: 1,
        items: [
          {
            id: "p1",
            label: "Минимализм Swiss",
            tool: "Midjourney",
            style: "minimal poster",
            prompt:
              "Minimalist poster about [TOPIC], single bold geometric object centered, swiss design, 3 muted pastel colors, generous negative space, no text, ultra-clean composition --ar 2:3",
            previewImageUrl: "/ai-creator/preview/lesson-6/swiss-minimal.webp",
          },
          {
            id: "p2",
            label: "Ретро 80-х",
            tool: "Midjourney",
            style: "retro 80s",
            prompt:
              "1980s retro poster about [TOPIC], synthwave gradient, neon grid horizon, bold geometric main object, sun in the background, no text, vintage paper texture --ar 2:3",
            previewImageUrl: "/ai-creator/preview/lesson-6/cola-cherry.webp",
          },
          {
            id: "p3",
            label: "Кино-постер",
            tool: "Midjourney",
            style: "movie poster",
            prompt:
              "Cinematic movie poster about [TOPIC], single dramatic main subject in the lower third, atmospheric sky with negative space at the top, moody lighting, cold and warm color contrast, no text --ar 2:3",
            previewImageUrl: "/ai-creator/preview/lesson-6/movie-poster.webp",
          },
          {
            id: "p4",
            label: "Японский плакат",
            tool: "Midjourney",
            style: "japanese",
            prompt:
              "Japanese-style traditional poster about [TOPIC], woodblock print influence, layered flat colors, calligraphic main object, vertical composition, mountain or wave background, no text --ar 2:3",
            previewImageUrl: "/ai-creator/preview/lesson-6/iced-tea.webp",
          },
          {
            id: "p5",
            label: "Иллюстрированный научпоп",
            tool: "Midjourney",
            style: "editorial illustration",
            prompt:
              "Editorial illustration poster about [TOPIC], hand-drawn texture, layered isometric composition, 4-color palette, science magazine cover style, no text, intricate details --ar 2:3",
            previewImageUrl: "/ai-creator/preview/lesson-6/porsche-poster.webp",
          },
        ],
        successNote: "Подставь свой [TOPIC] и сгенерируй визуальную базу.",
      },
    },
    {
      n: 3,
      completion: { type: "practice", key: "step-3" },
      caption: "ШАГ 3 ИЗ 5 · ВЁРСТКА",
      title: "Сгенерируй визуал и собери постер в Canva",
      description: "Финальный текст и заголовок ставим вручную.",
      kind: "action-step",
      content: {
        videoStartSeconds: 600,
        checkboxLabel: "Постер готов с заголовком и подписью",
        doneLabel: "Постер собран",
        instructions: [
          "Сгенерируй визуал в Midjourney по промту из шага 2.",
          "Скачай upscale.",
          "Открой Canva, создай дизайн A3 / A4 (или 2:3).",
          "Загрузи свой визуал как фон. Поставь заголовок крупным шрифтом, подзаголовок — мельче. Логотип / лого школы — в нижнем углу.",
          "Сохрани PNG в высоком качестве.",
        ],
        note: "В Canva используй максимум 2 шрифта: один для заголовка, один для подписи. Это правило профессиональной типографики.",
      },
    },
    {
      n: 4,
      completion: { type: "practice", key: "step-4" },
      caption: "ШАГ 4 ИЗ 5 · ПРОВЕРКА",
      title: "Чек-лист готового постера",
      description: "4 пункта самопроверки.",
      kind: "checklist",
      content: {
        items: [
          { id: "c1", question: "С 3 метров читается главный заголовок?", hintIfNo: "Увеличь шрифт. Если конкурирует с фоном — добавь полупрозрачную плашку." },
          { id: "c2", question: "На постере не больше 2 шрифтов?", hintIfNo: "Удали лишнее. 2 шрифта — золотое правило." },
          { id: "c3", question: "Есть ясная иерархия: заголовок → подзаголовок → детали?", hintIfNo: "Перестрой: размер заголовка должен быть в 2-3 раза больше деталей." },
          { id: "c4", question: "Цвета не «дерутся» друг с другом?", hintIfNo: "Используй палитру coolors.co — не больше 4 цветов." },
        ],
      },
    },
    {
      n: 5,
      completion: { type: "submission" },
      caption: "ШАГ 5 ИЗ 5 · СДАЧА",
      title: "Сдача учителю",
      description: "Покажи постер в Google Meet — расскажи, что и для кого делал.",
    },
  ],
};

// ─── Lesson 7 (smart): Видео-генерация ───────────────────────────────────────
export const AI_CREATOR_7_SMART_CONTENT: StudyLessonContent = {
  landing: {
    youtubeVideoId: "vLXUWFS1s00",
    recap:
      "Text-to-video — модель генерирует видео сразу по текстовому промту, без исходной картинки. Главные игроки: Veo 3 (Google), Sora (OpenAI), Kling 2.0. Качество промта = композиция + камера + действие. Учимся писать «сценарий за 2 предложения» — этого достаточно, чтобы получить кинематографичный 8-секундный клип.",
    anchors: [
      { time: "01:30", seconds: 90, label: "чем text-to-video отличается от image-to-video" },
      { time: "06:00", seconds: 360, label: "анатомия text-to-video промта" },
      { time: "12:00", seconds: 720, label: "Veo vs Sora vs Kling — когда что" },
    ],
  },
  steps: [
    {
      n: 1,
      completion: { type: "practice", key: "step-1" },
      caption: "ШАГ 1 ИЗ 5 · РАЗОГРЕВ",
      title: "Чем text-to-video сильнее обычной анимации",
      description: "Три вопроса.",
      kind: "which-tag-mini",
      content: {
        questions: [
          { id: "q1", text: "Что важнее для качественного text-to-video промта?", options: ["Длинное эссе на 500 слов", "Чёткое описание действия + камеры в 2-3 предложения", "Только Subject"], correctIndex: 1, explanation: "Модели любят сжатость + конкретику. «Сценарий за 2 предложения» — рабочий формат." },
          { id: "q2", text: "Что такое «camera movement» в промте?", options: ["Кто-то двигает телефон", "Описание движения виртуальной камеры: dolly, tilt, zoom", "Это не нужно"], correctIndex: 1, explanation: "Без указания движения камеры получишь статичный кадр — это часто скучно." },
          { id: "q3", text: "Сколько секунд обычно длится один text-to-video клип?", options: ["1-2 секунды", "5-10 секунд (Veo даёт 8 сек)", "30 секунд за раз"], correctIndex: 1, explanation: "Veo, Kling и Sora — все дают примерно одинаковый формат: 5-10 секунд." },
        ],
      },
    },
    {
      n: 2,
      completion: { type: "practice", key: "step-2" },
      caption: "ШАГ 2 ИЗ 5 · ГАЛЕРЕЯ",
      title: "5 готовых сценариев на 8 секунд",
      description: "Скопируй и подстрой под свою идею.",
      kind: "prompt-gallery",
      content: {
        targetTool: "Veo 3 / Kling 2.0",
        targetUrl: "https://veo.google.com",
        copiesRequired: 1,
        items: [
          {
            id: "p1",
            label: "Утро в Алматы",
            tool: "Veo 3",
            style: "cinematic",
            prompt:
              "A young person sits on a balcony in Almaty at sunrise, steam rising from a cup of tea. The camera slowly dollies forward as they smile and look at the mountains. Cinematic, warm golden light, shallow depth of field.",
          },
          {
            id: "p2",
            label: "Дождь в неоновом городе",
            tool: "Veo 3",
            style: "cyberpunk",
            prompt:
              "A futuristic neon city at night during rain. Camera tracks a figure walking under a glowing umbrella, reflections in puddles, slight motion blur. Cyberpunk color palette, ambient electronic mood.",
          },
          {
            id: "p3",
            label: "Спорт в slow motion",
            tool: "Kling 2.0",
            style: "sport slow-mo",
            prompt:
              "An athlete jumps to score a basketball. Slow motion (120fps), dust particles in the air, dramatic side light, camera arcs around them in a half-circle. Photorealistic, gym atmosphere.",
          },
          {
            id: "p4",
            label: "Подводный мир",
            tool: "Veo 3",
            style: "documentary nature",
            prompt:
              "Underwater scene: a school of colorful fish swims past a coral reef. Camera moves smoothly through them, soft caustic light filtering from the surface, particles in the water. National Geographic style.",
          },
          {
            id: "p5",
            label: "Стартап в гараже",
            tool: "Veo 3",
            style: "lifestyle",
            prompt:
              "Three teenagers working on a robot in a garage at night. Camera tilts down from a hanging lamp to reveal them assembling parts, soft warm light, focused concentration on faces. Documentary cinematic.",
          },
        ],
        successNote: "Подбери сценарий под свою тему.",
      },
    },
    {
      n: 3,
      completion: { type: "practice", key: "step-3" },
      caption: "ШАГ 3 ИЗ 5 · ГЕНЕРАЦИЯ",
      title: "Сгенерируй свой 8-секундный клип",
      description: "Открой Veo 3 или Kling.",
      kind: "action-step",
      content: {
        videoStartSeconds: 480,
        checkboxLabel: "Я получил клип, у меня есть финальная версия",
        doneLabel: "Видео готово",
        instructions: [
          "Открой Veo 3 (через Gemini Pro) или Kling.",
          "Вставь промт из шага 2.",
          "Запусти генерацию (2–5 минут ожидания).",
          "Если результат не идеален — переформулируй движение камеры и перегенерируй.",
        ],
        note: "Veo 3 умеет звук — добавь в промт описание звука, например `ambient city sound, soft jazz in background`.",
      },
    },
    {
      n: 4,
      completion: { type: "practice", key: "step-4" },
      caption: "ШАГ 4 ИЗ 5 · ПРОВЕРКА",
      title: "Чек-лист видео",
      description: "4 пункта качества.",
      kind: "checklist",
      content: {
        items: [
          { id: "c1", question: "В кадре есть осмысленное действие, а не просто статика?", hintIfNo: "Добавь глагол: «walks», «smiles», «jumps». Без действия видео мёртвое." },
          { id: "c2", question: "Движение камеры понятное и не дёрганое?", hintIfNo: "Уточни: «slow dolly forward», «smooth orbit». Без указания camera живёт сама по себе." },
          { id: "c3", question: "Лица людей не «плывут» уродливо во время движения?", hintIfNo: "Если морфит — уменьшай motion или генерируй ещё раз." },
          { id: "c4", question: "Если включил звук — он подходит к видео?", hintIfNo: "Сгенерируй беззвучным и положи свой саундтрек в Capcut/Premiere." },
        ],
      },
    },
    {
      n: 5,
      completion: { type: "submission" },
      caption: "ШАГ 5 ИЗ 5 · СДАЧА",
      title: "Сдача учителю",
      description: "Покажи 8-секундный клип в Google Meet.",
    },
  ],
};

// ─── Lesson 8 (smart): Lyria ─────────────────────────────────────────────────
export const AI_CREATOR_8_SMART_CONTENT: StudyLessonContent = {
  landing: {
    youtubeVideoId: "gbUjlFLaXrY",
    recap:
      "Lyria — генеративная музыкальная модель Google. Описываешь текстом жанр, инструменты, темп, настроение — получаешь оригинальный трек. Главное правило промта: меньше «красиво» и «atmospheric», больше конкретики — BPM, инструменты, эпоха, mood.",
    anchors: [
      { time: "01:30", seconds: 90, label: "что такое Lyria и чем отличается от Suno/Udio" },
      { time: "06:00", seconds: 360, label: "формула музыкального промта" },
      { time: "12:00", seconds: 720, label: "как монтировать музыку под видео" },
    ],
  },
  steps: [
    {
      n: 1,
      completion: { type: "practice", key: "step-1" },
      caption: "ШАГ 1 ИЗ 5 · РАЗОГРЕВ",
      title: "Что описывает музыкальный промт",
      description: "Три вопроса.",
      kind: "which-tag-mini",
      content: {
        questions: [
          { id: "q1", text: "Что важнее в музыкальном промте?", options: ["«Сделай красиво»", "Жанр + инструменты + BPM + настроение", "Длинное эссе"], correctIndex: 1, explanation: "Конкретика > эмоции. BPM 90, lo-fi piano, melancholic — рабочий промт." },
          { id: "q2", text: "Что такое BPM?", options: ["Бонусные минуты подписки", "Beats Per Minute — темп: чем больше, тем быстрее", "Тип файла"], correctIndex: 1, explanation: "BPM — главный рычаг настроения. 60 — спокойно, 120 — энергично, 160 — драм-н-бэйс." },
          { id: "q3", text: "Можно ли просить Lyria скопировать конкретного исполнителя?", options: ["Да, любого", "Нет — это нарушение прав. Просим стиль/жанр, а не «как у Канье»", "Только за подписку"], correctIndex: 1, explanation: "Авторские права у музыки — серьёзная зона. Описываем стиль, а не имена." },
        ],
      },
    },
    {
      n: 2,
      completion: { type: "practice", key: "step-2" },
      caption: "ШАГ 2 ИЗ 5 · ГАЛЕРЕЯ",
      title: "5 музыкальных шаблонов",
      description: "Под видео из урока 7 или под своё настроение.",
      kind: "prompt-gallery",
      content: {
        targetTool: "Lyria (через Google AI Studio)",
        targetUrl: "https://aistudio.google.com",
        copiesRequired: 1,
        items: [
          {
            id: "p1",
            label: "Lo-fi для учёбы",
            tool: "Lyria",
            style: "lo-fi",
            prompt:
              "Lo-fi hip hop instrumental, 80 BPM, dusty piano chords, soft kick drum, vinyl crackle, melancholic but warm mood, 2 minutes",
          },
          {
            id: "p2",
            label: "Эпичный кино-трейлер",
            tool: "Lyria",
            style: "cinematic",
            prompt:
              "Cinematic orchestral trailer music, 120 BPM, building strings, deep brass hits, epic choir at climax, hopeful and heroic mood, 1 minute, perfect for a movie poster reveal",
          },
          {
            id: "p3",
            label: "Электронный энергичный",
            tool: "Lyria",
            style: "electronic",
            prompt:
              "Energetic electronic track, 128 BPM, four-on-the-floor kick, synth bass, bright lead synth melody, festival big-room mood, drop at 30 seconds",
          },
          {
            id: "p4",
            label: "Фолк-баллада",
            tool: "Lyria",
            style: "folk",
            prompt:
              "Acoustic folk ballad, 70 BPM, fingerpicked guitar, soft cello, gentle male humming (no lyrics), nostalgic and warm, 2 minutes",
          },
          {
            id: "p5",
            label: "Атмосфера дождя",
            tool: "Lyria",
            style: "ambient",
            prompt:
              "Ambient piano with light rain field recording, 60 BPM, slow chord progression, distant thunder, contemplative and peaceful mood, 3 minutes, perfect for studying",
          },
        ],
        successNote: "Сгенерируй и подложи под видео из урока 7.",
      },
    },
    {
      n: 3,
      completion: { type: "practice", key: "step-3" },
      caption: "ШАГ 3 ИЗ 5 · ГЕНЕРАЦИЯ",
      title: "Сгенерируй трек в Lyria",
      description: "Скачай WAV или MP3.",
      kind: "action-step",
      content: {
        videoStartSeconds: 600,
        checkboxLabel: "У меня есть свой трек минимум 60 секунд",
        doneLabel: "Трек готов",
        instructions: [
          "Открой Google AI Studio → Lyria.",
          "Вставь промт из шага 2.",
          "Запусти. Получишь несколько вариантов на выбор.",
          "Скачай лучший в WAV/MP3.",
        ],
        note: "Если трек получился слишком повторяющимся — добавь в промт фразу «with a bridge at 30 seconds».",
      },
    },
    {
      n: 4,
      completion: { type: "practice", key: "step-4" },
      caption: "ШАГ 4 ИЗ 5 · ПРОВЕРКА",
      title: "Чек-лист трека",
      description: "4 пункта.",
      kind: "checklist",
      content: {
        items: [
          { id: "c1", question: "Темп (BPM) подходит под настроение?", hintIfNo: "Перегенерируй с другим BPM. 60 — медитация, 90 — спокойно, 120 — танцевально." },
          { id: "c2", question: "Инструменты звучат чисто, без артефактов?", hintIfNo: "Иногда Lyria даёт «грязный» микс — попробуй ещё раз с уточнением «clean mix, professional mastering»." },
          { id: "c3", question: "Трек не нарушает авторские права (ты не просил «как у Eminem»)?", hintIfNo: "Перепиши промт через стиль и жанр, а не имя." },
          { id: "c4", question: "Длина подходит под видео из урока 7?", hintIfNo: "Если не подходит — обрежь в Capcut или попроси Lyria сделать длиннее/короче." },
        ],
      },
    },
    {
      n: 5,
      completion: { type: "submission" },
      caption: "ШАГ 5 ИЗ 5 · СДАЧА",
      title: "Сдача учителю",
      description: "Покажи трек (или клип из урока 7 с этим треком) в Google Meet.",
    },
  ],
};

// ─── Lesson 7 (vip): Motion Control ──────────────────────────────────────────
export const AI_CREATOR_7_VIP_CONTENT: StudyLessonContent = {
  landing: {
    youtubeVideoId: "bP7Erf1Dsu4",
    recap:
      "Motion Control — продвинутая работа с движением: задаём не только «движение есть», а каждый кадр траектории через keyframes. Инструменты: Runway Motion Brush, Kling Camera Control, Luma Brainstorm. Это уже уровень режиссёра — ты выбираешь, какие пиксели двигаются и куда.",
    anchors: [
      { time: "01:30", seconds: 90, label: "что такое motion control и зачем он нужен" },
      { time: "06:00", seconds: 360, label: "Motion Brush в Runway — как это работает" },
      { time: "13:00", seconds: 780, label: "keyframes камеры в Kling" },
    ],
  },
  steps: [
    {
      n: 1,
      completion: { type: "practice", key: "step-1" },
      caption: "ШАГ 1 ИЗ 5 · РАЗОГРЕВ",
      title: "Чем motion control сильнее обычного промта?",
      description: "Три вопроса.",
      kind: "which-tag-mini",
      content: {
        questions: [
          { id: "q1", text: "Что делает Motion Brush в Runway?", options: ["Перекрашивает кадр", "Позволяет «нарисовать» движение на конкретных пикселях кадра — этот элемент сюда, тот туда", "Удаляет фон"], correctIndex: 1, explanation: "Motion Brush — это режиссёрский инструмент: ты сам решаешь, что и куда двигается." },
          { id: "q2", text: "Что такое camera keyframes?", options: ["Скриншоты", "Опорные точки траектории виртуальной камеры — ты задаёшь начало и конец, ИИ интерполирует", "Это не существует"], correctIndex: 1, explanation: "Keyframes — основа любого профессионального motion control." },
          { id: "q3", text: "Зачем использовать motion control вместо обычного промта?", options: ["Чтобы хвастаться", "Когда нужно точное движение — например, проезд камеры мимо логотипа справа налево", "Это не нужно"], correctIndex: 1, explanation: "Обычный промт — для общего настроения. Motion control — для контроля." },
        ],
      },
    },
    {
      n: 2,
      completion: { type: "practice", key: "step-2" },
      caption: "ШАГ 2 ИЗ 5 · ГАЛЕРЕЯ",
      title: "5 motion-control-сценариев",
      description: "Скопируй и реализуй через Motion Brush или camera keyframes.",
      kind: "prompt-gallery",
      content: {
        targetTool: "Runway Gen-3 (Motion Brush) / Kling (Camera Control)",
        targetUrl: "https://runwayml.com",
        copiesRequired: 1,
        items: [
          {
            id: "p1",
            label: "Кинематографичный реверс-камеры",
            tool: "Kling Camera Control",
            style: "advanced cinematic",
            prompt:
              "Camera starts close on subject's face, then pulls back rapidly revealing they are standing on top of a skyscraper. Use camera keyframes: keyframe 1 = close-up, keyframe 2 = wide aerial shot, smooth transition over 8 seconds.",
          },
          {
            id: "p2",
            label: "Selective motion — только волосы",
            tool: "Runway Motion Brush",
            style: "isolated motion",
            prompt:
              "Static portrait. Use Motion Brush only on the hair — moderate wind-like motion to the right. Background and face stay completely still. Photoreal, soft window light.",
          },
          {
            id: "p3",
            label: "Объект влетает в кадр",
            tool: "Runway Motion Brush",
            style: "object animation",
            prompt:
              "Use Motion Brush to make a paper airplane fly across the room from left to right, passing in front of the subject mid-frame. Subject reacts at keyframe 4 with a slight head turn.",
          },
          {
            id: "p4",
            label: "Орбитальный облёт продукта",
            tool: "Kling Camera Control",
            style: "product",
            prompt:
              "Camera orbits the central product 360° smoothly over 8 seconds. Camera keyframes every 90°. Studio lighting stays consistent. Product remains in the centre of the frame at all times.",
          },
          {
            id: "p5",
            label: "Параллакс с глубиной",
            tool: "Runway Motion Brush",
            style: "parallax",
            prompt:
              "Static landscape. Use Motion Brush on different layers: foreground rocks move slightly to the right, midground tree stays still, background mountains move slightly to the left. Creates 3D parallax depth from a still image.",
          },
        ],
        successNote: "Реализуй один — это уже режиссура.",
      },
    },
    {
      n: 3,
      completion: { type: "practice", key: "step-3" },
      caption: "ШАГ 3 ИЗ 5 · РЕЖИССУРА",
      title: "Сделай свой контролируемый кадр",
      description: "Motion Brush или Camera Keyframes.",
      kind: "action-step",
      content: {
        videoStartSeconds: 600,
        checkboxLabel: "Я реализовал motion control: один движущийся элемент / один камера-keyframe",
        doneLabel: "Контроль есть",
        instructions: [
          "Открой Runway Gen-3 → Motion Brush. ИЛИ Kling → Camera Control.",
          "Загрузи статичную картинку.",
          "В Motion Brush «нарисуй» области движения и направление. В Kling — расставь camera keyframes.",
          "Сгенерируй и сравни с обычным image-to-video — почувствуй разницу.",
        ],
        note: "Это самая мощная фича 2026 — индустрия только осваивает.",
      },
    },
    {
      n: 4,
      completion: { type: "practice", key: "step-4" },
      caption: "ШАГ 4 ИЗ 5 · ПРОВЕРКА",
      title: "Чек-лист режиссёра",
      description: "4 пункта.",
      kind: "checklist",
      content: {
        items: [
          { id: "c1", question: "Motion control реально влияет на результат — видна разница с обычной генерацией?", hintIfNo: "Если разницы нет — Motion Brush «закрашен» слишком слабо или keyframes слишком близки." },
          { id: "c2", question: "Движение там, где я его задал — а не где попало?", hintIfNo: "Перепрорисуй маску точнее. Указывай резкие границы движения." },
          { id: "c3", question: "Кадр не «сломался» от слишком агрессивного motion?", hintIfNo: "Уменьши motion strength или сделай более плавный keyframe-переход." },
          { id: "c4", question: "Я сохранил исходную статику для сравнения?", hintIfNo: "Сделай side-by-side — это и есть твой главный аргумент в портфолио." },
        ],
      },
    },
    {
      n: 5,
      completion: { type: "submission" },
      caption: "ШАГ 5 ИЗ 5 · СДАЧА",
      title: "Сдача учителю",
      description: "Покажи side-by-side: обычная генерация vs motion control.",
    },
  ],
};

// ─── Lesson 8 (vip): Cinema Studio ───────────────────────────────────────────
export const AI_CREATOR_8_VIP_CONTENT: StudyLessonContent = {
  landing: {
    youtubeVideoId: "xJ5PaYZQkv8",
    recap:
      "Cinema Studio — финальный синтез: ты собираешь короткий фильм. Связываешь несколько 5–10-секундных клипов через монтаж, добавляешь музыку (Lyria), голос диктора (ElevenLabs), цветокор. На выходе — 30–60-секундная история, которая выглядит как трейлер.",
    anchors: [
      { time: "01:30", seconds: 90, label: "что такое мини-фильм за один день" },
      { time: "07:00", seconds: 420, label: "склейка клипов в CapCut" },
      { time: "15:00", seconds: 900, label: "ElevenLabs voiceover" },
    ],
  },
  steps: [
    {
      n: 1,
      completion: { type: "practice", key: "step-1" },
      caption: "ШАГ 1 ИЗ 5 · РАЗОГРЕВ",
      title: "Анатомия мини-фильма",
      description: "Три вопроса.",
      kind: "which-tag-mini",
      content: {
        questions: [
          { id: "q1", text: "Сколько клипов нужно для трейлера на 30 секунд?", options: ["1 длинный", "5–8 коротких клипов по 4–6 секунд — динамичный монтаж", "20+ клипов — мелькание"], correctIndex: 1, explanation: "5–8 — это крепкий рабочий ритм. 1 длинный — скучно, 20+ — зритель потеряется." },
          { id: "q2", text: "Что такое цветокор (color grading)?", options: ["Перекраска", "Финальная единая цветовая палитра по всем клипам — без него фильм «разваливается»", "Только эффект сепия"], correctIndex: 1, explanation: "Без цветокора отдельные клипы выглядят как разные люди снимали — это самый заметный признак любителя." },
          { id: "q3", text: "Зачем добавлять voiceover?", options: ["Чтобы дольше", "Чтобы рассказать историю — голос склеивает разрозненные клипы в нарратив", "Только если нет музыки"], correctIndex: 1, explanation: "Голос-нарратор — мощнейший склеивающий приём. ElevenLabs делает реалистичный голос за минуты." },
        ],
      },
    },
    {
      n: 2,
      completion: { type: "practice", key: "step-2" },
      caption: "ШАГ 2 ИЗ 5 · ГАЛЕРЕЯ",
      title: "5 готовых сценариев на трейлер",
      description: "Каждый сценарий — это 5–7 промтов для отдельных клипов.",
      kind: "prompt-gallery",
      content: {
        targetTool: "Veo 3 + CapCut + Lyria + ElevenLabs",
        targetUrl: "https://veo.google.com",
        copiesRequired: 1,
        items: [
          {
            id: "p1",
            label: "«День из жизни школьника 2045»",
            tool: "сценарий",
            style: "lifestyle trailer",
            prompt:
              "Сценарий из 6 клипов:\n1. Утро. Будильник в форме голограммы, рука выключает.\n2. Завтрак с роботом-ассистентом.\n3. Школьный коридор будущего, ученики в AR-очках.\n4. Урок с голографическим преподавателем.\n5. Перерыв на крыше с видом на летающие машины.\n6. Закат, главный герой смотрит в небо.",
          },
          {
            id: "p2",
            label: "«История одного открытия»",
            tool: "сценарий",
            style: "documentary",
            prompt:
              "Сценарий из 5 клипов:\n1. Учёный пишет формулу на стекле.\n2. Эксперимент в лаборатории — провал.\n3. Ночь, бессонница, лицо в свете монитора.\n4. Прорыв — глаза загораются от понимания.\n5. Финал — на доске нарисована работающая схема.",
          },
          {
            id: "p3",
            label: "«Команда стартапа»",
            tool: "сценарий",
            style: "startup",
            prompt:
              "Сценарий из 6 клипов:\n1. Гараж ночью, трое подростков работают над прототипом.\n2. Пицца на столе, споры у whiteboard.\n3. Первый запуск — устройство мигает.\n4. Питч инвесторам, нервная улыбка.\n5. Рукопожатие.\n6. Год спустя — офис, та же тройка в костюмах.",
          },
          {
            id: "p4",
            label: "«Путешествие через стихии»",
            tool: "сценарий",
            style: "epic",
            prompt:
              "Сценарий из 5 клипов:\n1. Пустыня, песчаная буря, силуэт идёт.\n2. Лес, дождь, та же фигура в плаще.\n3. Горы, снег, восхождение.\n4. Океан, шторм, лодка.\n5. Финал — на вершине горы, рассвет, крик.",
          },
          {
            id: "p5",
            label: "«Один день в Алматы»",
            tool: "сценарий",
            style: "city",
            prompt:
              "Сценарий из 7 клипов:\n1. Рассвет над горами, аэрокадр.\n2. Зеленый базар, движение людей в slow-mo.\n3. Кофейня, чашка, окна в дождь.\n4. Парк Горького, дети на велосипедах.\n5. Метро Алматы, в окне — отражения.\n6. Мечеть Хазрет Султан в закате.\n7. Ночные огни Кок-Тобе, звёзды.",
          },
        ],
        successNote: "Выбери один сценарий — генерируй каждый клип отдельно через Veo 3.",
      },
    },
    {
      n: 3,
      completion: { type: "practice", key: "step-3" },
      caption: "ШАГ 3 ИЗ 5 · ПРОИЗВОДСТВО",
      title: "Сними мини-фильм по сценарию",
      description: "Veo 3 → CapCut → Lyria → ElevenLabs.",
      kind: "action-step",
      content: {
        videoStartSeconds: 720,
        checkboxLabel: "Готов 30–60-секундный фильм с музыкой и/или голосом",
        doneLabel: "Фильм собран",
        instructions: [
          "Сгенерируй каждый клип сценария отдельно в Veo 3 (или Kling).",
          "Открой CapCut, склей клипы в нужном порядке. Уберy «лишние» концы — оставь по 4-6 секунд.",
          "В Lyria сгенерируй музыку под настроение фильма.",
          "В ElevenLabs (опционально) запиши voiceover — короткие фразы между клипами.",
          "Финальный цветокор: применить один LUT на весь таймлайн.",
        ],
        note: "Цветокор — самая важная склейка. Один LUT на все клипы превращает разрозненные генерации в единый фильм.",
      },
    },
    {
      n: 4,
      completion: { type: "practice", key: "step-4" },
      caption: "ШАГ 4 ИЗ 5 · ПРОВЕРКА",
      title: "Чек-лист режиссёра-выпускника",
      description: "4 пункта качества.",
      kind: "checklist",
      content: {
        items: [
          { id: "c1", question: "У фильма есть начало, середина и конец (story arc)?", hintIfNo: "Перерасставь клипы. Зритель должен понять — куда мы пришли в финале." },
          { id: "c2", question: "Все клипы выглядят как из одного фильма (цветокор + темп)?", hintIfNo: "Применить один LUT и привести темп склеек в единое — каждые 4-6 секунд." },
          { id: "c3", question: "Музыка усиливает, а не «забивает» картинку?", hintIfNo: "Уменьши громкость музыки на -10dB под voiceover, или поменяй BPM." },
          { id: "c4", question: "Финал имеет «punch» — сильный кадр или фраза?", hintIfNo: "Передвинь самый эффектный клип на конец. Мы помним последнее, не первое." },
        ],
      },
    },
    {
      n: 5,
      completion: { type: "submission" },
      caption: "ШАГ 5 ИЗ 5 · СДАЧА",
      title: "Финальный показ",
      description: "Покажи свой мини-фильм в Google Meet и расскажи о решениях монтажа.",
    },
  ],
};
