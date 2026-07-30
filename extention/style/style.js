function injectCss() {
  if (document.getElementById('subtitle-style')) return;
  const style = document.createElement('style');
  style.id = 'subtitle-style';
  style.textContent = `



    /* Subtitle container */
    #subtitle-translate {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 95%;
      text-align: center;
      pointer-events: none;
      z-index: 40;
      font-size: 28px;
    }
    #subtitle-translate .sub-original,
    #subtitle-translate .sub-translated {
      font-size: inherit;
      font-weight: 600;
      margin: 0;
    }
    #subtitle-translate .sub-original {
      color: #fff;
      pointer-events: auto;
      user-select: text;
      -webkit-user-select: text;
    }
    #subtitle-translate .sub-translated {
      color: #fff;
      margin-top: 0.5em;
      pointer-events: none;
    }
    #subtitle-translate .sub-line {
      display: table;
      margin: 0 auto;
      white-space: pre-wrap;
      word-break: break-word;
      background: rgba(0,0,0,0.4);
      padding: 5px 13px;
      border-radius: 4px;
      line-height: 1.3;
      text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
    }
    #subtitle-translate .sub-line + .sub-line {
      margin-top: 0.5em;
    }
    #subtitle-translate .sub-original::selection {
      color: #ffe600;
    }










    /* ===== Word Popup ===== */
    .popup-container {
        flex: 1;
    }

    #word-popup {
      position: absolute;
      display: flex;
      visibility: hidden;
      z-index: 42;
      min-width: clamp(140px, 12vw, 280px);
      max-width: clamp(200px, 50vw, 500px); /* giới hạn chiều rộng tối đa 500px */
      background: white;
      border-radius: clamp(8px, 1vw, 14px);
      font-family: "Segoe UI", Roboto, Arial, sans-serif;
      font-size: clamp(13px, 1.2vw, 18px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.35);
      border: 1px solid rgba(0,0,0,0.08);
      animation: word-popup-fade 0.12s ease-out;
      pointer-events: auto;
      padding: 5px 6px;
    }

    .popup-content {
    max-height: 200px;
    overflow-y: auto;

    /* Cuộn mượt */
    scroll-behavior: smooth;

    /* iOS / touchpad */
    -webkit-overflow-scrolling: touch;

    /* Ẩn scrollbar */
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.popup-content::-webkit-scrollbar {
    display: none;
}

    #word-popup::after {
      content: "";
      position: absolute;
      bottom: -6px;
      left: 50%;
      width: 12px;
      height: 12px;
      border-right: 1px solid rgba(0,0,0,0.08);
      border-bottom: 1px solid rgba(0,0,0,0.08);
      transform: translateX(-50%) rotate(45deg);
      background: white;
    }

    @keyframes word-popup-fade {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .word-popup-word {
      font-weight: 600;
      font-size: 1em;
      margin-bottom: 0.2em;
      word-break: break-word;
      text-align: center;
      color: black;
    }

    .word-popup-ipa {
      color: #555;
      font-size: 0.85em;
      margin-bottom: 0.4em;
      min-height: 1.2em;
      text-align: center;
    }

    .word-popup-meaning {
      color: #222;
      font-size: 0.9em;
      line-height: 1.4;
      margin-bottom: 0.6em;
      min-height: 1.2em;
      text-align: center;
    }

    /* Container chính (audio + save) */
    .container-word {
      display: flex;
      gap: 0.6em;
      align-items: center;
      justify-content: space-between;
      padding-top: 5px;
      border-top: 1px solid #f3f4f6;
    }

    /* Wrapper nút audio – hình tròn, co giãn */
    .inside-word-audio {
      display: flex;
      align-items: center;
      justify-content: center;
      width: clamp(28px, 2vw, 44px);
      height: clamp(28px, 2vw, 44px);
      border-radius: 50%;
      transition: background-color 0.2s, transform 0.1s;
      background-color: transparent;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .inside-word-audio {
        transition: background-color 0.2s, transform 0.15s;
    }

    .inside-word-audio:hover {
        background-color: #f3f4f6;
    }

    .inside-word-audio:active {
        transform: scale(0.9);
    }


    /* Nút audio bên trong */
    .word-popup-audio {
      display: flex;
      border: none;
      background: none;
      cursor: pointer;
      padding: 0;
      display: flex !important;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    .word-popup-audio img {
      width: clamp(18px, 1.8vw, 28px);
      height: 70%;
      display: block; /* ảnh sẽ nằm giữa nhờ flex của button */
      pointer-events: none;
    }

    /* Nút Save */
    .word-popup-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #3b82f6;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: clamp(4px, 0.4vw, 8px) clamp(10px, 1vw, 20px);
      font-size: 0.85em;
      cursor: pointer;
      transition: background 0.15s;
      white-space: nowrap;
    }

    .word-popup-btn:hover {
      background: #2563eb;
    }

    .word-popup-btn:disabled {
      background: #999;
      cursor: default;
    }

    /* Trạng thái loading */
    .word-popup.loading {
      min-width: 120px;
      text-align: center;
    }
    .word-popup.loading .container-word {
      display: none;
    }



    
  `;
  document.head.appendChild(style);
}