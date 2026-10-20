"use client";

// Primitif animasi untuk halaman login dan registrasi, diadaptasi dari
// "Modern Animated Sign In" (21st.dev): input dengan cahaya mengikuti kursor
// dan BoxReveal. Warna memakai token aplikasi (globals.css), dan semua gerak
// dimatikan kalau pengguna memilih reduced motion.
import { useState, type CSSProperties, type ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// ==================== Input ====================

export function Input({
  className,
  ref,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> }) {
  const radius = 110;
  const [visible, setVisible] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const background = useMotionTemplate`radial-gradient(${visible ? radius : 0}px circle at ${mouseX}px ${mouseY}px, var(--glow), transparent 80%)`;

  return (
    <motion.div
      style={{ background }}
      onMouseMove={({ currentTarget, clientX, clientY }) => {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
      }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      className="group/input rounded-xl p-[2px] transition duration-300"
    >
      <input
        ref={ref}
        className={cx(
          "flex h-11 w-full rounded-[10px] border-none bg-card-soft px-3.5 text-sm text-ink shadow-[0_0_0_1px_var(--line)] transition duration-300 placeholder:text-muted/70 group-hover/input:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:shadow-[0_0_0_1px_var(--neg)]",
          className,
        )}
        {...props}
      />
    </motion.div>
  );
}

// ==================== Label ====================

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cx("text-xs font-semibold text-muted", className)} {...props} />;
}

// ==================== BoxReveal ====================
// Versi CSS murni (kelas .box-reveal di globals.css): animasi jalan begitu
// halaman tampil, tanpa menunggu JavaScript selesai dimuat. Kalau JS lambat
// atau gagal, form tetap terlihat.

type BoxRevealProps = {
  children: ReactNode;
  width?: string;
  boxColor?: string;
  duration?: number;
  delay?: number;
  overflow?: "hidden" | "visible";
  className?: string;
};

export function BoxReveal({
  children,
  width = "fit-content",
  boxColor = "var(--brand)",
  duration = 0.4,
  delay = 0,
  overflow = "hidden",
  className,
}: BoxRevealProps) {
  const style = {
    width,
    overflow,
    "--br-box": boxColor,
    "--br-dur": `${duration}s`,
    "--br-delay": `${delay}s`,
  } as CSSProperties;
  return (
    <div className={cx("box-reveal", className)} style={style}>
      <div className="box-reveal-content">{children}</div>
      <div aria-hidden className="box-reveal-box" />
    </div>
  );
}

// ==================== BottomGradient ====================

export function BottomGradient() {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-[#7ce577] to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-[#f4ffc7] to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
}
