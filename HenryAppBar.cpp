// HenryAppBar.cpp - helper to register/unregister an existing window as an AppBar.
//
// Usage:
//   HenryAppBar.exe set <position> <thickness> <hwnd>
//   HenryAppBar.exe remove <hwnd>
//
// position: "top" | "bottom" | "left" | "right"
// thickness: height (for top/bottom) or width (for left/right) in pixels
// hwnd: decimal integer value of HWND (cast from pointer-sized integer).
//
// For "set", this prints "x y width height\n" to stdout with the final bounds.

#define UNICODE
#define _UNICODE
#include <windows.h>
#include <shellapi.h>
#include <wchar.h>
#include <stdio.h>
#include <stdlib.h>

static UINT edgeFromPosition(const wchar_t* pos) {
    if (_wcsicmp(pos, L"bottom") == 0) return ABE_BOTTOM;
    if (_wcsicmp(pos, L"left")   == 0) return ABE_LEFT;
    if (_wcsicmp(pos, L"right")  == 0) return ABE_RIGHT;
    return ABE_TOP;
}

int wmain(int argc, wchar_t* argv[])
{
    if (argc < 3) {
        fwprintf(stderr,
                 L"Usage:\n"
                 L"  HenryAppBar.exe set <position> <thickness> <hwnd>\n"
                 L"  HenryAppBar.exe remove <hwnd>\n");
        return 1;
    }

    const wchar_t* op = argv[1];

    // --- remove -------------------------------------------------------------
    if (_wcsicmp(op, L"remove") == 0) {
        if (argc < 3) {
            fwprintf(stderr, L"Usage: HenryAppBar.exe remove <hwnd>\n");
            return 1;
        }
        const wchar_t* hwndStr = argv[2];
        ULONGLONG hwndVal = _wcstoui64(hwndStr, nullptr, 10);
        HWND hWnd = (HWND)(ULONG_PTR)hwndVal;

        APPBARDATA abd = { 0 };
        abd.cbSize = sizeof(APPBARDATA);
        abd.hWnd = hWnd;
        SHAppBarMessage(ABM_REMOVE, &abd);
        return 0;
    }

    // --- set -------------------------------------------------------------
    if (_wcsicmp(op, L"set") != 0 || argc < 5) {
        fwprintf(stderr, L"Usage: HenryAppBar.exe set <position> <thickness> <hwnd>\n");
        return 1;
    }

    const wchar_t* posStr   = argv[2];
    const wchar_t* thickStr = argv[3];
    const wchar_t* hwndStr  = argv[4];

    UINT edge = edgeFromPosition(posStr);
    int thickness = _wtoi(thickStr);
    if (thickness <= 0) thickness = 40;

    ULONGLONG hwndVal = _wcstoui64(hwndStr, nullptr, 10);
    HWND hWnd = (HWND)(ULONG_PTR)hwndVal;

    // Primary monitor bounds
    RECT screenRect;
    screenRect.left   = 0;
    screenRect.top    = 0;
    screenRect.right  = GetSystemMetrics(SM_CXSCREEN);
    screenRect.bottom = GetSystemMetrics(SM_CYSCREEN);

    APPBARDATA abd = { 0 };
    abd.cbSize = sizeof(APPBARDATA);
    abd.hWnd   = hWnd;
    abd.uCallbackMessage = 0; // no callbacks
    abd.uEdge  = edge;
    abd.rc     = screenRect;

    // Register as appbar
    SHAppBarMessage(ABM_NEW, &abd);

    // Let shell adjust vs taskbar/other bars
    SHAppBarMessage(ABM_QUERYPOS, &abd);

    // Enforce thickness
    switch (edge) {
    case ABE_TOP:
        abd.rc.bottom = abd.rc.top + thickness;
        break;
    case ABE_BOTTOM:
        abd.rc.top = abd.rc.bottom - thickness;
        break;
    case ABE_LEFT:
        abd.rc.right = abd.rc.left + thickness;
        break;
    case ABE_RIGHT:
        abd.rc.left = abd.rc.right - thickness;
        break;
    }

    // Commit position
    SHAppBarMessage(ABM_SETPOS, &abd);

    int x = abd.rc.left;
    int y = abd.rc.top;
    int w = abd.rc.right  - abd.rc.left;
    int h = abd.rc.bottom - abd.rc.top;

    // Electron will parse this
    wprintf(L"%d %d %d %d\n", x, y, w, h);
    return 0;
}
