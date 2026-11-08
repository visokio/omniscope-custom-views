"""Builds ../regions_fr.json, the department outlines the France Choropleth view draws.

Source: the "france-geojson" project by Gregoire David (github.com/gregoiredavid/france-geojson), pinned to one
commit below. Its outlines come from IGN's ADMIN EXPRESS COG (2018 edition) and its names and codes from INSEE's
Code officiel geographique, both published under the Licence Ouverte / Open Licence (Etalab). The derived file
keeps that licence: reuse is free, with attribution to the source.

Steps: download the metropolitan departments and the overseas file; project metropolitan France with the
Lambert-93 projection and simplify the shared borders together (mapshaper keeps neighbouring outlines matching);
project each overseas department on its own and place it in an inset box under the mainland map, with a last box
showing Paris and its inner suburbs enlarged; write SVG path strings in a 600-pixel-wide frame.

Needs Python 3 and Node (for `npx mapshaper`). Run from this folder: python3 make_basemap.py
"""
import json, math, os, subprocess, tempfile, urllib.request

COMMIT = "5d34ee6d0140c29f785fdb047d9329f1aab58833"
BASE = f"https://cdn.jsdelivr.net/gh/gregoiredavid/france-geojson@{COMMIT}/"
MAPSHAPER = ["npx", "--yes", "mapshaper@0.7.101"]
WIDTH = 600                 # frame width in pixels
INSET_H, INSET_GAP = 96, 8  # inset boxes under the mainland map
LAMBERT93 = "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +units=m"
OVERSEAS = ["971", "972", "973", "974", "976"]  # Guadeloupe, Martinique, Guyane, La Reunion, Mayotte
PARIS = ["75", "92", "93", "94"]                  # drawn again, enlarged, in the last inset box


def fetch(name, folder):
    path = os.path.join(folder, name)
    with urllib.request.urlopen(BASE + name) as r, open(path, "wb") as f:
        f.write(r.read())
    return path


def mapshaper(args):
    subprocess.run(MAPSHAPER + args, check=True, stdout=subprocess.DEVNULL)


def rings(geom):
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    return [ring for poly in polys for ring in poly]


def path_of(rings_xy):
    """SVG path: absolute move to the first point of each ring, then relative lines, one decimal."""
    out = []
    for ring in rings_xy:
        pts = [(round(x, 1), round(y, 1)) for x, y in ring]
        pts = [p for i, p in enumerate(pts) if i == 0 or p != pts[i - 1]]
        if len(pts) > 1 and pts[0] == pts[-1]:
            pts = pts[:-1]
        if len(pts) < 3:
            continue
        s = f"M{pts[0][0]:g},{pts[0][1]:g}l"
        steps = []
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            steps.append(f"{round(x1 - x0, 1):g},{round(y1 - y0, 1):g}")
        out.append(s + " ".join(steps) + "z")
    return "".join(out).replace(" -", "-")


def main():
    with tempfile.TemporaryDirectory() as tmp:
        metro_src = fetch("departements.geojson", tmp)
        all_src = fetch("departements-avec-outre-mer.geojson", tmp)
        metro_out = os.path.join(tmp, "metro.json")
        mapshaper(["-i", metro_src, "-proj", LAMBERT93, "-simplify", "4%", "weighted", "keep-shapes",
                   "-o", "format=geojson", metro_out])
        paris_out = os.path.join(tmp, "paris.json")  # less simplified, as it is drawn enlarged
        mapshaper(["-i", metro_src, "-filter", "%s.indexOf(code) > -1" % json.dumps(PARIS), "-proj", LAMBERT93,
                   "-simplify", "30%", "weighted", "keep-shapes", "-o", "format=geojson", paris_out])
        dom_in = os.path.join(tmp, "dom-in.json")
        with open(all_src) as f:
            src = json.load(f)
        src["features"] = [ft for ft in src["features"] if ft["properties"]["code"] in OVERSEAS]
        with open(dom_in, "w") as f:
            json.dump(src, f)
        dom_out = os.path.join(tmp, "dom.json")
        mapshaper(["-i", dom_in, "-simplify", "8%", "weighted", "keep-shapes", "-o", "format=geojson", dom_out])
        with open(metro_out) as f:
            metro = json.load(f)["features"]
        with open(dom_out) as f:
            dom = {ft["properties"]["code"]: ft for ft in json.load(f)["features"]}
        with open(paris_out) as f:
            paris = json.load(f)["features"]

    # Mainland: scale the Lambert-93 metres to the frame width (y up in metres, down in pixels).
    xs = [x for ft in metro for r in rings(ft["geometry"]) for x, _ in r]
    ys = [y for ft in metro for r in rings(ft["geometry"]) for _, y in r]
    pad, min_x, max_y = 4, min(xs), max(ys)
    k = (WIDTH - 2 * pad) / (max(xs) - min_x)
    main_h = math.ceil((max_y - min(ys)) * k + 2 * pad)
    to_px = lambda x, y: (pad + (x - min_x) * k, pad + (max_y - y) * k)
    departments = []
    for ft in sorted(metro, key=lambda f: f["properties"]["code"]):
        p = ft["properties"]
        departments.append({"code": p["code"], "name": p["nom"],
                            "path": path_of([[to_px(x, y) for x, y in r] for r in rings(ft["geometry"])])})

    # Insets: each overseas department in its own box, equirectangular around its centre; then Paris enlarged.
    n_boxes = len(OVERSEAS) + 1
    box_w = (WIDTH - INSET_GAP * (n_boxes - 1)) / n_boxes
    top = main_h + INSET_GAP
    label_h = 14
    insets = []

    def fit(rs, i, flip_y):
        """Scale and centre rings (already in a planar x, y) into box i; returns a point converter."""
        pts = [p for r in rs for p in r]
        x0, x1 = min(p[0] for p in pts), max(p[0] for p in pts)
        y0, y1 = min(p[1] for p in pts), max(p[1] for p in pts)
        bx = i * (box_w + INSET_GAP)
        s = min((box_w - 12) / (x1 - x0), (INSET_H - label_h - 10) / (y1 - y0))
        ox = bx + (box_w - (x1 - x0) * s) / 2
        oy = top + label_h + (INSET_H - label_h - (y1 - y0) * s) / 2
        insets.append({"x": round(bx, 1), "y": top, "width": round(box_w, 1), "height": INSET_H})
        return lambda x, y: (ox + (x - x0) * s, oy + ((y1 - y) if flip_y else (y - y0)) * s)

    for i, code in enumerate(OVERSEAS):
        ft = dom[code]
        rs = rings(ft["geometry"])
        c = math.cos(math.radians(sum(y for r in rs for _, y in r) / sum(len(r) for r in rs)))
        rs = [[(x * c, y) for x, y in r] for r in rs]
        conv = fit(rs, i, True)
        departments.append({"code": code, "name": ft["properties"]["nom"],
                            "path": path_of([[conv(x, y) for x, y in r] for r in rs])})
        insets[-1].update({"label": ft["properties"]["nom"], "codes": [code]})

    # Paris and its inner suburbs, from the mainland outlines already in pixels.
    pr = {ft["properties"]["code"]: [[to_px(x, y) for x, y in r] for r in rings(ft["geometry"])] for ft in paris}
    conv = fit([r for rs in pr.values() for r in rs], len(OVERSEAS), False)
    insets[-1].update({"label": "Paris area", "codes": PARIS,
                       "paths": [{"code": c, "path": path_of([[conv(x, y) for x, y in r] for r in pr[c]])}
                                 for c in PARIS]})

    out = {
        "width": WIDTH, "height": top + INSET_H + 2,
        "source": "france-geojson by Gregoire David, from IGN ADMIN EXPRESS COG 2018 and INSEE COG; "
                  "simplified and projected (Lambert-93) for this view",
        "licence": "Licence Ouverte / Open Licence (Etalab)",
        "insets": insets,
        "departments": departments,
    }
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, "..", "regions_fr.json"), "w") as f:
        json.dump(out, f, ensure_ascii=True, separators=(",", ":"))
        f.write("\n")
    print(len(departments), "departments,", os.path.getsize(os.path.join(here, "..", "regions_fr.json")), "bytes")


if __name__ == "__main__":
    main()
