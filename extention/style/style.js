function injectCss() {

    if (document.getElementById("subtitle-style")) return;

    const style = document.createElement("style");

    style.id = "subtitle-style";

    style.textContent = `

        #subtitle-translate{
            position:absolute;
            left:50%;
            transform:translateX(-50%);
            width:95%;
            
            text-align:center;
            pointer-events:none;
            z-index:40;
            font-size:28px;
        }

        #subtitle-translate .sub-original,
        #subtitle-translate .sub-translated{
            font-size:inherit;
            font-weight:600;
            margin:0;
        }

        #subtitle-translate .sub-original{
            color:#fff;
        }

        #subtitle-translate .sub-translated{
            margin-top:0.5em;
            color:#fff;
        }

        #subtitle-translate .sub-line{

            display:table;

            margin-left:auto;
            margin-right:auto;

            white-space:pre-wrap;
            word-break:break-word;

            background:rgba(0,0,0,0.4);

            padding:5px 13px;
            border-radius:4px;

            line-height:1.3;

            text-shadow:
                -1px -1px 0 #000,
                1px -1px 0 #000,
                -1px  1px 0 #000,
                1px  1px 0 #000;

            box-decoration-break:clone;
            -webkit-box-decoration-break:clone;
        }

        #subtitle-translate .sub-line + .sub-line{
            margin-top:0.5em;
        }
            
    `;

    document.head.appendChild(style);

}