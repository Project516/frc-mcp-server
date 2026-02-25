# FRC Context (Robot Code + WPILib + Vendor Libraries)

This MCP server reads files from `src/data/`.
Anything you place there becomes searchable/readable by agents through MCP tools.

## 1) Add your team robot code

Recommended structure:

```text
src/data/
  robot/
    src/main/java/frc/robot/...
    build.gradle
    gradle.properties
```

Quick method:

1. Copy only useful source/config files into `src/data/robot`.
2. Exclude heavy folders like `.gradle`, `build`, `bin`, `out`.
3. Commit and redeploy.

## 2) Add WPILib docs/reference context

Recommended structure:

```text
src/data/
  wpilib/
    docs/
    api-notes/
```

Good sources to include:

- Notes or excerpts from docs for command-based, kinematics, odometry, autos, PID.
- Small API cheat sheets you create from WPILib classes your team uses.
- Example snippets your team relies on.

Keep it focused. Smaller, high-signal docs improve agent answers.

## 3) Add vendor library context (REV, CTRE, PathPlanner, PhotonVision, etc.)

Recommended structure:

```text
src/data/
  vendors/
    rev/
    ctre/
    pathplanner/
    photonvision/
```

Include:

- Your own notes for setup/config patterns
- Vendor API snippets your robot actually uses
- Key constants/config docs

Avoid dumping giant generated artifacts.

## 4) Keep context clean

Best practices:

- Keep files plain text / markdown / source files.
- Prefer fewer, better files over huge copies of entire websites.
- Add one `README.md` in each subfolder describing what is inside.
- Remove stale docs every season.

## 5) Verify from an MCP client

Once deployed, have the agent call:

1. `list_frc_sources`
2. `search_frc_context` with queries like `PIDController`, `SwerveDriveKinematics`, `kP`, `AutoBuilder`
3. `get_frc_file` for exact files and line ranges

## 6) Security and privacy

- Treat everything in `src/data/` as potentially visible to any user who can access your MCP server.
- Do not include secrets, tokens, private keys, or unpublished scouting data.
- If needed, make the deployment private behind your own gateway/auth.

## 7) Updating workflow each season

1. Refresh `src/data/robot` from the current season code.
2. Refresh `src/data/wpilib` and `src/data/vendors` with current-season APIs.
3. Redeploy to Vercel.
4. Re-run a few search queries to sanity-check answers.
