# Security Notes

## Known Vulnerabilities

### pkg (GHSA-22r3-9w55-cj54)

**Severity**: Moderate  
**Type**: Local Privilege Escalation  
**Status**: Risk Accepted

The `pkg` package used for creating standalone executables has a known vulnerability. This risk is accepted because:

- **Dev-only dependency**: pkg is not shipped to npm users; it's only used during the build process
- **Local access required**: The vulnerability requires local system access to exploit
- **No fix available**: The pkg maintainers have not released a fix
- **Alternative distribution**: Users can install via `npm install -g zork-ts` without any pkg involvement

If you're concerned about this vulnerability, use the npm package instead of building standalone executables:

```bash
npm install -g zork-ts
zork
```

## Reporting Security Issues

If you discover a security vulnerability, please report it by opening an issue on GitHub.
