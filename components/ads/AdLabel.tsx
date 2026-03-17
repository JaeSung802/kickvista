/**
 * AdLabel — always-visible label required by AdSense policy.
 * "Advertisement" is unambiguous and clearly separates ads from content.
 */
export default function AdLabel() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#484f58",
        backgroundColor: "transparent",
        borderRadius: 3,
        lineHeight: "1.6",
        userSelect: "none",
      }}
    >
      Advertisement
    </span>
  );
}
