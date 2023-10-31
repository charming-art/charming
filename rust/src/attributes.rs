extern crate wasm_bindgen;
use crate::backend::Backend;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
impl Backend {
    pub fn stroke(&mut self, ch: u32, ch1: u32, fg: u32, bg: u32) {
        self.has_stroke = true;
        self.stroke_color = [ch, ch1, fg, bg];
    }
    pub fn fill(&mut self, ch: u32, ch1: u32, fg: u32, bg: u32) {
        self.has_fill = true;
        self.fill_color = [ch, ch1, fg, bg];
    }
    pub fn background(&mut self, ch: u32, ch1: u32, fg: u32, bg: u32) {
        self.has_background = true;
        self.background_color = [ch, ch1, fg, bg];
    }
    #[wasm_bindgen(js_name = "noStroke")]
    pub fn no_stroke(&mut self) {
        self.has_stroke = false;
    }
    #[wasm_bindgen(js_name = "noFill")]
    pub fn no_fill(&mut self) {
        self.has_fill = false;
    }
}

#[cfg(test)]
mod tests {
    use super::Backend;

    #[test]
    fn should_set_stroke() {
        let mut backend: Backend = Backend::new(10, 10);
        backend.stroke(0, 0, 0, 0);
        assert_eq!(backend.stroke_color[0], 0);
        assert_eq!(backend.stroke_color[1], 0);
        assert_eq!(backend.stroke_color[2], 0);
        assert_eq!(backend.stroke_color[3], 0);
    }
}
