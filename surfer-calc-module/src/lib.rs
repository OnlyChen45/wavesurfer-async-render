use wasm_bindgen::prelude::*;

// #[wasm_bindgen]
// extern "C" {
//     fn alert(s: &str);
// }
struct Point {
    pub x: f32,
    pub y: f32,
}
#[wasm_bindgen]
struct PointArrays {
    xs: Vec<f32>,
    ys: Vec<f32>,
}
#[wasm_bindgen]
impl PointArrays {
    #[wasm_bindgen(constructor)]
    pub fn new(xs: Vec<f32>, ys: Vec<f32>) -> Self {
        Self { xs, ys }
    }
    #[wasm_bindgen(getter)]
    pub fn xs(&self) -> Vec<f32> {
        self.xs.clone() // ✅ 必须 clone！&self 不能 move
    }

    #[wasm_bindgen(getter)]
    pub fn ys(&self) -> Vec<f32> {
        self.ys.clone() // ✅ 同上
    }
    #[wasm_bindgen(getter)]
    pub fn len(&self) -> usize {
        self.xs.len()
    }
}

#[wasm_bindgen]
pub fn calc_paths(
    channel_data: &[f32],
    index: i32,
    width: f32,
    half_height: f32,
    v_scale: f32,
) -> PointArrays {
    let len = channel_data.len();
    let h_scale: f32 = if len > 0 { width / (len as f32) } else { 0.0 };
    let base_y = half_height;
    let direction = if index == 1 { -1 } else { 1 };
    let mut path: Vec<Point> = vec![Point { x: 0.0, y: base_y }];
    let mut prev_x: f32 = 0.0;
    let mut max: f32 = 0.0;
    for i in 0..len {
        let x = ((i as f32) * h_scale).round();
        if x > prev_x {
            let height_delta = (max * half_height * v_scale).round();
            let y = base_y + height_delta * (direction as f32);
            path.push(Point { x: x, y: y });
            prev_x = x;
            max = 0.0;
        }
        let current_x = channel_data.get(i).copied().unwrap_or(0.0).abs();
        if current_x > max {
            max = current_x;
        }
    }
    path.push(Point {
        x: prev_x,
        y: base_y,
    });
    let (xs, ys): (Vec<f32>, Vec<f32>) = path.into_iter().map(|p| (p.x, p.y)).unzip();
    return PointArrays { xs: xs, ys: ys };
}
