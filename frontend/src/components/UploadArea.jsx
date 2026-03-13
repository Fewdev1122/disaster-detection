export default function UploadArea({ preview, onClick }) {
  return (
    <div
      onClick={onClick}
      className="w-full h-[55vh] border-2 border-dashed border-gray-300
                 rounded-2xl bg-gray-50 flex items-center justify-center
                 overflow-hidden mb-5 cursor-pointer relative"
    >
      {preview ? (
        <>
          <img
            src={preview}
            alt="preview"
            className="w-full h-full object-cover"
            draggable={false}
          />

          <div className="absolute inset-0 bg-black/20 flex items-end justify-center pb-4">
            <span className="text-white text-sm bg-black/40 px-3 py-1 rounded-full">
              แตะเพื่อเปลี่ยนรูป
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center text-center px-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="88"
            height="88"
            viewBox="0 0 24 24"
          >
            <g
              fill="none"
              stroke="#808080"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            >
              <path
                strokeDasharray="20"
                d="M12 15h2v-6h2.5l-4.5 -4.5M12 15h-2v-6h-2.5l4.5 -4.5"
              >
                <animate
                  attributeName="d"
                  dur="1.5s"
                  keyTimes="0;0.5;1"
                  repeatCount="indefinite"
                  values="M12 15h2v-6h2.5l-4.5 -4.5M12 15h-2v-6h-2.5l4.5 -4.5;M12 15h2v-3h2.5l-4.5 -4.5M12 15h-2v-3h-2.5l4.5 -4.5;M12 15h2v-6h2.5l-4.5 -4.5M12 15h-2v-6h-2.5l4.5 -4.5"
                />
                <animate
                  fill="freeze"
                  attributeName="stroke-dashoffset"
                  dur="0.5s"
                  values="20;0"
                />
              </path>

              <path
                strokeDasharray="14"
                strokeDashoffset="14"
                d="M6 19h12"
              >
                <animate
                  fill="freeze"
                  attributeName="stroke-dashoffset"
                  begin="0.5s"
                  dur="0.2s"
                  to="0"
                />
              </path>
            </g>
          </svg>

          <span className="text-gray-400 text-sm mt-2">
            แตะเพื่ออัปโหลดรูปภาพ
          </span>
        </div>
      )}
    </div>
  );
}