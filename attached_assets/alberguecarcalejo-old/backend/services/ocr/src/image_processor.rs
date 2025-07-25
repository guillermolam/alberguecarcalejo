use image::{DynamicImage, GrayImage, ImageBuffer, Luma, Rgb, RgbImage};
use imageproc::contrast::threshold;
use imageproc::definitions::Connectivity;
use imageproc::edges::sobel_gradients;
use imageproc::filter::gaussian_blur_f32;
use imageproc::geometric_transformations::{rotate_about_center, Interpolation};
use imageproc::hough::{detect_lines, LineDetectionOptions, PolarLine};
use imageproc::morphology::{close, open};
use std::f32::consts::PI;

pub struct ImageProcessor;

impl ImageProcessor {
    pub fn preprocess(image: &DynamicImage) -> Result<GrayImage, Box<dyn std::error::Error>> {
        // First, auto-rotate the image if needed
        let rotated_image = Self::auto_rotate(image);

        // Convert to grayscale
        let mut gray_image = rotated_image.to_luma8();

        // Apply Gaussian blur to reduce noise
        gray_image = gaussian_blur_f32(&gray_image, 0.5);

        // Enhance contrast first
        gray_image = Self::enhance_contrast(gray_image);

        // Apply adaptive threshold instead of Otsu for better text handling
        gray_image = Self::apply_adaptive_threshold(gray_image);

        // Apply morphological operations to clean up text
        gray_image = Self::morphological_cleanup(gray_image);

        Ok(gray_image)
    }

    pub fn preprocess_for_ocr(
        image: &DynamicImage,
    ) -> Result<GrayImage, Box<dyn std::error::Error>> {
        // Specialized preprocessing for OCR with less aggressive processing
        let rotated_image = Self::auto_rotate(image);
        let mut gray_image = rotated_image.to_luma8();

        // Light noise reduction
        gray_image = Self::reduce_noise_light(gray_image);

        // Enhance contrast
        gray_image = Self::enhance_contrast(gray_image);

        Ok(gray_image)
    }

    fn reduce_noise(image: GrayImage) -> GrayImage {
        // Apply a simple median filter for noise reduction
        let (width, height) = image.dimensions();
        let mut result = image.clone();

        for y in 1..height - 1 {
            for x in 1..width - 1 {
                let mut neighbors = Vec::new();
                for dy in -1..=1 {
                    for dx in -1..=1 {
                        let px = (x as i32 + dx) as u32;
                        let py = (y as i32 + dy) as u32;
                        neighbors.push(image.get_pixel(px, py)[0]);
                    }
                }
                neighbors.sort();
                result.put_pixel(x, y, Luma([neighbors[4]])); // Median value
            }
        }

        result
    }

    fn apply_otsu_threshold(image: GrayImage) -> GrayImage {
        // Calculate histogram
        let mut histogram = [0u32; 256];
        for pixel in image.pixels() {
            histogram[pixel[0] as usize] += 1;
        }

        // Find Otsu threshold
        let total_pixels = image.width() * image.height();
        let threshold_value = Self::calculate_otsu_threshold(&histogram, total_pixels);

        // Apply threshold
        threshold(&image, threshold_value)
    }

    fn apply_adaptive_threshold(image: GrayImage) -> GrayImage {
        let (width, height) = image.dimensions();
        let mut result = image.clone();
        let block_size = 15; // Size of the neighborhood area
        let c = 5; // Constant subtracted from the mean

        for y in 0..height {
            for x in 0..width {
                // Calculate mean of neighborhood
                let mut sum = 0u32;
                let mut count = 0u32;

                let start_x = x.saturating_sub(block_size / 2);
                let end_x = std::cmp::min(x + block_size / 2, width - 1);
                let start_y = y.saturating_sub(block_size / 2);
                let end_y = std::cmp::min(y + block_size / 2, height - 1);

                for ny in start_y..=end_y {
                    for nx in start_x..=end_x {
                        sum += image.get_pixel(nx, ny)[0] as u32;
                        count += 1;
                    }
                }

                let mean = sum / count;
                let threshold = mean.saturating_sub(c);
                let pixel_value = image.get_pixel(x, y)[0] as u32;

                if pixel_value > threshold {
                    result.put_pixel(x, y, Luma([255]));
                } else {
                    result.put_pixel(x, y, Luma([0]));
                }
            }
        }

        result
    }

    fn reduce_noise_light(image: GrayImage) -> GrayImage {
        // Light noise reduction using a smaller kernel
        let (width, height) = image.dimensions();
        let mut result = image.clone();

        for y in 1..height - 1 {
            for x in 1..width - 1 {
                let mut values = Vec::new();
                for dy in -1..=1 {
                    for dx in -1..=1 {
                        let px = (x as i32 + dx) as u32;
                        let py = (y as i32 + dy) as u32;
                        values.push(image.get_pixel(px, py)[0]);
                    }
                }
                values.sort();
                // Use median value
                result.put_pixel(x, y, Luma([values[4]]));
            }
        }

        result
    }

    fn calculate_otsu_threshold(histogram: &[u32; 256], total_pixels: u32) -> u8 {
        let mut sum_total = 0.0;
        for i in 0..256 {
            sum_total += (i as f64) * (histogram[i] as f64);
        }

        let mut sum_background = 0.0;
        let mut weight_background = 0;
        let mut weight_foreground;
        let mut mean_background;
        let mut mean_foreground;
        let mut max_variance = 0.0;
        let mut threshold = 0;

        for i in 0..256 {
            weight_background += histogram[i];
            if weight_background == 0 {
                continue;
            }

            weight_foreground = total_pixels - weight_background;
            if weight_foreground == 0 {
                break;
            }

            sum_background += (i as f64) * (histogram[i] as f64);
            mean_background = sum_background / (weight_background as f64);
            mean_foreground = (sum_total - sum_background) / (weight_foreground as f64);

            let between_class_variance = (weight_background as f64)
                * (weight_foreground as f64)
                * (mean_background - mean_foreground).powi(2);

            if between_class_variance > max_variance {
                max_variance = between_class_variance;
                threshold = i;
            }
        }

        threshold as u8
    }

    fn morphological_cleanup(image: GrayImage) -> GrayImage {
        // Apply opening (erosion followed by dilation) to remove noise
        let opened = open(&image, Connectivity::Eight, 1);

        // Apply closing (dilation followed by erosion) to fill gaps
        close(&opened, Connectivity::Eight, 1)
    }

    fn enhance_contrast(mut image: GrayImage) -> GrayImage {
        // Simple contrast enhancement using histogram stretching
        let mut min_val = 255u8;
        let mut max_val = 0u8;

        // Find min and max values
        for pixel in image.pixels() {
            let val = pixel[0];
            if val < min_val {
                min_val = val;
            }
            if val > max_val {
                max_val = val;
            }
        }

        // Stretch histogram
        let range = max_val - min_val;
        if range > 0 {
            for pixel in image.pixels_mut() {
                let old_val = pixel[0];
                let new_val = ((old_val - min_val) as f32 / range as f32 * 255.0) as u8;
                pixel[0] = new_val;
            }
        }

        image
    }

    pub fn auto_rotate(image: &DynamicImage) -> DynamicImage {
        // Detect document orientation and rotate if necessary
        // This is a simplified implementation
        let gray = image.to_luma8();
        let rotation_angle = Self::detect_rotation_angle(&gray);

        if rotation_angle.abs() > 1.0 {
            let rotated = rotate_about_center(
                &image.to_rgba8(),
                rotation_angle,
                Interpolation::Bilinear,
                image::Rgba([255, 255, 255, 255]),
            );
            DynamicImage::ImageRgba8(rotated)
        } else {
            image.clone()
        }
    }

    pub fn detect_rotation_angle(image: &GrayImage) -> f32 {
        // 1. Edge detection (Sobel)
        let sobel = sobel_gradients(image);

        // 2. Hough line detection (use wide angle range, high accumulator threshold)
        let options = LineDetectionOptions {
            vote_threshold: 120, // tweak depending on DPI/scan, lower if faint lines
            suppression_radius: 10,
        };

        // Try both edge directions: 0..180 degrees
        let lines: Vec<PolarLine> = detect_lines(&sobel, options);

        // 3. Extract angles of lines close to horizontal
        let mut angles = Vec::new();
        for line in lines.iter() {
            // PolarLine.theta is in radians: 0 = vertical, PI/2 = horizontal
            let deg = line.theta * 180.0 / PI;
            // Accept only lines close to horizontal (within ±35 deg of horizontal, but not                     verticals)
            if (deg > 45.0 && deg < 135.0) || (deg < -45.0 && deg > -135.0) {
                let skew = deg - 90.0; // how much it deviates from horizontal
                angles.push(skew);
            }
        }

        if angles.is_empty() {
            // No lines detected; assume no rotation needed
            return 0.0;
        }

        // 4. Average the skew angles
        let mean_skew = angles.iter().copied().sum::<f32>() / angles.len() as f32;

        // Clamp the result to [-15, 15] degrees for safety
        mean_skew.clamp(-15.0, 15.0)
    }
}
