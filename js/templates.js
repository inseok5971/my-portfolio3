/**
 * Card News Templates Collection
 * Includes the default Character Card News (Image 1) and recommended presets
 */

const CARD_TEMPLATES = [
  {
    id: "character-main",
    name: "캐릭터 카드뉴스",
    badge: "대표",
    width: 1080,
    height: 1080,
    background: "#d6efff",
    previewBg: "#d6efff",
    objects: [
      // 하늘색 체크 패턴 배경 장식 (패턴 대체용 서브 사각 그리드)
      {
        type: "rect",
        left: 0,
        top: 0,
        width: 1080,
        height: 1080,
        fill: "#e2f2ff",
        selectable: false,
        name: "background-base",
        isTemplateBg: true
      },
      // 폴더 형태 메인 화이트 카드
      {
        type: "rect",
        left: 120,
        top: 150,
        width: 840,
        height: 800,
        rx: 16,
        ry: 16,
        fill: "#ffffff",
        stroke: "#1e293b",
        strokeWidth: 4,
        selectable: true,
        name: "folder-card",
        shadow: {
          color: "rgba(0,0,0,0.06)",
          blur: 15,
          offsetX: 0,
          offsetY: 8
        }
      },
      // 폴더 탭 (서류철 탭)
      {
        type: "polygon",
        points: [
          { x: 0, y: 0 },
          { x: 260, y: 0 },
          { x: 300, y: 50 },
          { x: 0, y: 50 }
        ],
        left: 150,
        top: 104,
        fill: "#ffffff",
        stroke: "#1e293b",
        strokeWidth: 4,
        strokeLineJoin: "round",
        selectable: true,
        name: "folder-tab"
      },
      // 폴더 탭 덮개 선 가리기용 흰색 바
      {
        type: "rect",
        left: 154,
        top: 148,
        width: 250,
        height: 8,
        fill: "#ffffff",
        selectable: false
      },
      // 강조 말풍선 (블랙 배지)
      {
        type: "rect",
        left: 360,
        top: 250,
        width: 360,
        height: 64,
        rx: 32,
        ry: 32,
        fill: "#18181b",
        selectable: true,
        name: "highlight-badge-bg"
      },
      // 말풍선 꼬리표
      {
        type: "triangle",
        left: 530,
        top: 310,
        width: 20,
        height: 14,
        angle: 180,
        fill: "#18181b",
        selectable: true,
        name: "highlight-badge-tail"
      },
      // 강조 텍스트
      {
        type: "textbox",
        left: 370,
        top: 268,
        width: 340,
        text: "강조 텍스트가 들어갑니다.",
        fontSize: 22,
        fontFamily: "Pretendard",
        fontWeight: "bold",
        fill: "#ffffff",
        textAlign: "center",
        selectable: true,
        name: "highlight-text"
      },
      // 메인 제목 1: 캐릭터
      {
        type: "textbox",
        left: 200,
        top: 360,
        width: 680,
        text: "캐릭터",
        fontSize: 120,
        fontFamily: "Pretendard",
        fontWeight: "900",
        fill: "#0077ff",
        textAlign: "center",
        selectable: true,
        name: "main-title-1"
      },
      // 메인 제목 2: 카드뉴스
      {
        type: "textbox",
        left: 200,
        top: 510,
        width: 680,
        text: "카드뉴스",
        fontSize: 120,
        fontFamily: "Pretendard",
        fontWeight: "900",
        fill: "#111827",
        textAlign: "center",
        selectable: true,
        name: "main-title-2"
      },
      // 하단 구분선
      {
        type: "line",
        points: [0, 0, 840, 0],
        left: 120,
        top: 760,
        stroke: "#1e293b",
        strokeWidth: 3,
        selectable: true,
        name: "divider-line"
      },
      // 하단 텍스트: 미리컴퍼니
      {
        type: "textbox",
        left: 200,
        top: 800,
        width: 680,
        text: "미리컴퍼니",
        fontSize: 26,
        fontFamily: "Pretendard",
        fontWeight: "bold",
        fill: "#1f2937",
        textAlign: "center",
        selectable: true,
        name: "footer-text"
      },
      // 좌측 하단 캐릭터 (노란색 아기새 마스코트)
      {
        type: "group",
        left: 70,
        top: 670,
        selectable: true,
        name: "character-yellow",
        subObjects: [
          // 몸통
          {
            type: "path",
            path: "M 30,140 C 20,70 50,10 110,10 C 170,10 200,70 190,140 Z",
            fill: "#fed766",
            stroke: "#1e293b",
            strokeWidth: 4
          },
          // 눈 1
          {
            type: "circle",
            left: 95,
            top: 75,
            radius: 5,
            fill: "#1e293b"
          },
          // 눈 2
          {
            type: "circle",
            left: 135,
            top: 75,
            radius: 5,
            fill: "#1e293b"
          },
          // 부리
          {
            type: "triangle",
            left: 110,
            top: 85,
            width: 14,
            height: 10,
            angle: 180,
            fill: "#f97316",
            stroke: "#1e293b",
            strokeWidth: 2
          },
          // 볼터치
          {
            type: "circle",
            left: 78,
            top: 85,
            radius: 7,
            fill: "#ff8fa3",
            opacity: 0.6
          },
          {
            type: "circle",
            left: 145,
            top: 85,
            radius: 7,
            fill: "#ff8fa3",
            opacity: 0.6
          }
        ]
      },
      // 우측 하단 캐릭터 (초록색 젤리 마스코트)
      {
        type: "group",
        left: 860,
        top: 760,
        selectable: true,
        name: "character-green",
        subObjects: [
          // 몸통
          {
            type: "path",
            path: "M 20,130 C 10,50 60,10 120,10 C 180,10 230,50 220,130 Z",
            fill: "#86efac",
            stroke: "#1e293b",
            strokeWidth: 4
          },
          // 눈
          {
            type: "path",
            path: "M 80,65 Q 90,55 100,65",
            stroke: "#1e293b",
            strokeWidth: 4,
            fill: "transparent"
          },
          {
            type: "path",
            path: "M 130,65 Q 140,55 150,65",
            stroke: "#1e293b",
            strokeWidth: 4,
            fill: "transparent"
          },
          // 입
          {
            type: "path",
            path: "M 110,78 Q 115,86 120,78",
            stroke: "#1e293b",
            strokeWidth: 3,
            fill: "transparent"
          },
          // 볼터치
          {
            type: "circle",
            left: 68,
            top: 72,
            radius: 8,
            fill: "#f472b6",
            opacity: 0.5
          },
          {
            type: "circle",
            left: 155,
            top: 72,
            radius: 8,
            fill: "#f472b6",
            opacity: 0.5
          }
        ]
      },
      // 우측 상단 캐릭터 (구름 마스코트)
      {
        type: "group",
        left: 840,
        top: 260,
        selectable: true,
        name: "character-cloud",
        subObjects: [
          // 구름 몸통
          {
            type: "path",
            path: "M 60,100 A 30,30 0 0,1 70,50 A 40,40 0 0,1 140,40 A 35,35 0 0,1 180,80 A 30,30 0 0,1 170,120 A 30,30 0 0,1 60,100 Z",
            fill: "#bae6fd",
            stroke: "#1e293b",
            strokeWidth: 4
          },
          // 눈
          {
            type: "circle",
            left: 105,
            top: 72,
            radius: 4,
            fill: "#1e293b"
          },
          {
            type: "circle",
            left: 135,
            top: 72,
            radius: 4,
            fill: "#1e293b"
          },
          // 미소
          {
            type: "path",
            path: "M 115,82 Q 120,88 125,82",
            stroke: "#1e293b",
            strokeWidth: 3,
            fill: "transparent"
          },
          // 볼터치
          {
            type: "circle",
            left: 95,
            top: 78,
            radius: 6,
            fill: "#f472b6",
            opacity: 0.5
          },
          {
            type: "circle",
            left: 142,
            top: 78,
            radius: 6,
            fill: "#f472b6",
            opacity: 0.5
          }
        ]
      }
    ]
  },

  // 템플릿 2: 기쁨가득 카드뉴스 (스프링 노트 스타일)
  {
    id: "spring-note",
    name: "기쁨가득 카드뉴스",
    badge: "인기",
    width: 1080,
    height: 1080,
    background: "#fef3c7",
    previewBg: "#fef3c7",
    objects: [
      {
        type: "rect",
        left: 100,
        top: 100,
        width: 880,
        height: 880,
        rx: 24,
        ry: 24,
        fill: "#ffffff",
        stroke: "#38bdf8",
        strokeWidth: 5,
        shadow: { color: "rgba(0,0,0,0.08)", blur: 20, offsetX: 0, offsetY: 10 }
      },
      // 스프링 링 장식
      ...[180, 260, 340, 420, 500, 580, 660, 740, 820, 900].map(x => ({
        type: "rect",
        left: x,
        top: 80,
        width: 24,
        height: 48,
        rx: 8,
        ry: 8,
        fill: "#cbd5e1",
        stroke: "#64748b",
        strokeWidth: 3
      })),
      {
        type: "textbox",
        left: 200,
        top: 260,
        width: 680,
        text: "올 한해 당신을 채울",
        fontSize: 32,
        fontFamily: "Pretendard",
        fontWeight: "bold",
        fill: "#64748b",
        textAlign: "center"
      },
      {
        type: "textbox",
        left: 150,
        top: 350,
        width: 780,
        text: "기쁨가득",
        fontSize: 110,
        fontFamily: "Pretendard",
        fontWeight: "900",
        fill: "#0ea5e9",
        textAlign: "center"
      },
      {
        type: "textbox",
        left: 150,
        top: 480,
        width: 780,
        text: "카드뉴스",
        fontSize: 110,
        fontFamily: "Pretendard",
        fontWeight: "900",
        fill: "#1e293b",
        textAlign: "center"
      },
      {
        type: "circle",
        left: 460,
        top: 670,
        radius: 80,
        fill: "#e0f2fe",
        stroke: "#0284c7",
        strokeWidth: 4
      },
      {
        type: "textbox",
        left: 470,
        top: 730,
        width: 140,
        text: "START!",
        fontSize: 24,
        fontFamily: "Pretendard",
        fontWeight: "900",
        fill: "#0369a1",
        textAlign: "center"
      }
    ]
  },

  // 템플릿 3: 쉽고 귀여운 카드뉴스
  {
    id: "cute-easy",
    name: "쉽고 귀여운 카드뉴스",
    badge: "추천",
    width: 1080,
    height: 1080,
    background: "#fffbeb",
    previewBg: "#fffbeb",
    objects: [
      {
        type: "rect",
        left: 120,
        top: 140,
        width: 840,
        height: 800,
        rx: 32,
        ry: 32,
        fill: "#ffffff",
        stroke: "#fbbf24",
        strokeWidth: 6,
        shadow: { color: "rgba(251, 191, 36, 0.2)", blur: 25, offsetX: 0, offsetY: 12 }
      },
      {
        type: "textbox",
        left: 200,
        top: 260,
        width: 680,
        text: "누구나 3분만에 만드는",
        fontSize: 32,
        fontFamily: "Pretendard",
        fontWeight: "bold",
        fill: "#f59e0b",
        textAlign: "center"
      },
      {
        type: "textbox",
        left: 150,
        top: 360,
        width: 780,
        text: "쉽고 귀여운",
        fontSize: 105,
        fontFamily: "Pretendard",
        fontWeight: "900",
        fill: "#10b981",
        textAlign: "center"
      },
      {
        type: "textbox",
        left: 150,
        top: 490,
        width: 780,
        text: "카드뉴스",
        fontSize: 105,
        fontFamily: "Pretendard",
        fontWeight: "900",
        fill: "#1f2937",
        textAlign: "center"
      },
      {
        type: "rect",
        left: 390,
        top: 670,
        width: 300,
        height: 60,
        rx: 30,
        ry: 30,
        fill: "#fef08a",
        stroke: "#eab308",
        strokeWidth: 3
      },
      {
        type: "textbox",
        left: 400,
        top: 686,
        width: 280,
        text: "지금 확인하기 →",
        fontSize: 22,
        fontFamily: "Pretendard",
        fontWeight: "bold",
        fill: "#854d0e",
        textAlign: "center"
      }
    ]
  },

  // 템플릿 4: 심플한 카드뉴스 (미니멀 핑크)
  {
    id: "simple-pink",
    name: "심플한 카드뉴스",
    badge: "심플",
    width: 1080,
    height: 1080,
    background: "#fff1f2",
    previewBg: "#fff1f2",
    objects: [
      {
        type: "rect",
        left: 120,
        top: 120,
        width: 840,
        height: 840,
        rx: 20,
        ry: 20,
        fill: "#ffffff",
        stroke: "#f43f5e",
        strokeWidth: 4
      },
      {
        type: "textbox",
        left: 160,
        top: 240,
        width: 760,
        text: "SIMPLE & CLEAN",
        fontSize: 24,
        fontFamily: "Pretendard",
        fontWeight: "bold",
        fill: "#f43f5e",
        textAlign: "center"
      },
      {
        type: "textbox",
        left: 160,
        top: 340,
        width: 760,
        text: "심플한",
        fontSize: 110,
        fontFamily: "Pretendard",
        fontWeight: "900",
        fill: "#e11d48",
        textAlign: "center"
      },
      {
        type: "textbox",
        left: 160,
        top: 480,
        width: 760,
        text: "카드뉴스",
        fontSize: 110,
        fontFamily: "Pretendard",
        fontWeight: "900",
        fill: "#1e293b",
        textAlign: "center"
      },
      {
        type: "circle",
        left: 480,
        top: 680,
        radius: 60,
        fill: "#fce7f3",
        stroke: "#f43f5e",
        strokeWidth: 3
      },
      {
        type: "textbox",
        left: 490,
        top: 730,
        width: 100,
        text: "🐰",
        fontSize: 48,
        textAlign: "center"
      }
    ]
  },

  // 템플릿 5: 비즈니스 정보형 카드뉴스
  {
    id: "business-dark",
    name: "비즈니스 정보형",
    badge: "프로",
    width: 1080,
    height: 1080,
    background: "#0f172a",
    previewBg: "#0f172a",
    objects: [
      {
        type: "rect",
        left: 80,
        top: 80,
        width: 920,
        height: 920,
        rx: 16,
        ry: 16,
        fill: "#1e293b",
        stroke: "#38bdf8",
        strokeWidth: 2
      },
      {
        type: "rect",
        left: 140,
        top: 140,
        width: 140,
        height: 40,
        rx: 20,
        ry: 20,
        fill: "#0284c7"
      },
      {
        type: "textbox",
        left: 140,
        top: 150,
        width: 140,
        text: "TREND 2026",
        fontSize: 16,
        fontFamily: "Pretendard",
        fontWeight: "bold",
        fill: "#ffffff",
        textAlign: "center"
      },
      {
        type: "textbox",
        left: 140,
        top: 260,
        width: 800,
        text: "놓치면 후회하는",
        fontSize: 44,
        fontFamily: "Pretendard",
        fontWeight: "700",
        fill: "#94a3b8",
        textAlign: "left"
      },
      {
        type: "textbox",
        left: 140,
        top: 340,
        width: 800,
        text: "성공하는 비즈니스\n카드뉴스 전략",
        fontSize: 84,
        fontFamily: "Pretendard",
        fontWeight: "900",
        fill: "#f8fafc",
        textAlign: "left"
      },
      {
        type: "textbox",
        left: 140,
        top: 600,
        width: 800,
        text: "데이터로 증명된 5가지 핵심 법칙과\n실제 실무 적용 가이드를 지금 바로 확인하세요.",
        fontSize: 28,
        fontFamily: "Pretendard",
        fontWeight: "500",
        fill: "#cbd5e1",
        lineHeight: 1.5,
        textAlign: "left"
      }
    ]
  },

  // 템플릿 6: 와글와글 카드뉴스
  {
    id: "wagle-fun",
    name: "와글와글 카드뉴스",
    badge: "귀여움",
    width: 1080,
    height: 1080,
    background: "#ecfdf5",
    previewBg: "#ecfdf5",
    objects: [
      {
        type: "rect",
        left: 100,
        top: 100,
        width: 880,
        height: 880,
        rx: 28,
        ry: 28,
        fill: "#ffffff",
        stroke: "#10b981",
        strokeWidth: 4
      },
      {
        type: "textbox",
        left: 160,
        top: 240,
        width: 760,
        text: "도란도란 재미있는 이야기",
        fontSize: 32,
        fontFamily: "Pretendard",
        fontWeight: "bold",
        fill: "#059669",
        textAlign: "center"
      },
      {
        type: "textbox",
        left: 160,
        top: 340,
        width: 760,
        text: "와글와글",
        fontSize: 110,
        fontFamily: "Pretendard",
        fontWeight: "900",
        fill: "#047857",
        textAlign: "center"
      },
      {
        type: "textbox",
        left: 160,
        top: 480,
        width: 760,
        text: "카드뉴스",
        fontSize: 110,
        fontFamily: "Pretendard",
        fontWeight: "900",
        fill: "#1f2937",
        textAlign: "center"
      }
    ]
  }
];
