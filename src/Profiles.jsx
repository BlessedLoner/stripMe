function ProfileCard({ name, avatar, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px",
        cursor: "pointer",
        borderBottom: "1px solid #ddd",
      }}
    >
      <img
        src={avatar}
        alt={name}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          marginRight: "10px",
        }}
      />
      <span>{name}</span>
    </div>
  );
}

export default ProfileCard;
